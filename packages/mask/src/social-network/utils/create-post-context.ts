import { ValueRef } from '@dimensiondev/holoflows-kit'
import type {
    PostContext,
    PostContextAuthor,
    PostContextCreation,
    PostContextSNSActions,
} from '@masknet/plugin-infra/content-script'
import {
    extractTextFromTypedMessage,
    isTypedMessageEqual,
    makeTypedMessageTupleFromList,
    type TypedMessage,
    type TypedMessageTuple,
} from '@masknet/typed-message'
import {
    ALL_EVENTS,
    ObservableMap,
    ObservableSet,
    parseURL,
    Payload,
    PostIdentifier,
    ProfileIdentifier,
    SubscriptionFromValueRef,
    SubscriptionDebug as debug,
    mapSubscription,
    EMPTY_LIST,
} from '@masknet/shared-base'
import { Err, Result } from 'ts-results'
import type { Subscription } from 'use-subscription'
import { activatedSocialNetworkUI } from '../ui'
import { resolveFacebookLink } from '../../social-network-adaptor/facebook.com/utils/resolveFacebookLink'
import type { SupportedPayloadVersions } from '@masknet/encryption'

export function createSNSAdaptorSpecializedPostContext(create: PostContextSNSActions) {
    return function createPostContext(opt: PostContextCreation): PostContext {
        const cancel: (Function | undefined)[] = []
        opt.signal?.addEventListener('abort', () => cancel.forEach((fn) => fn?.()))

        // #region Post text content
        const postContent = new ValueRef(extractText())
        cancel.push(opt.rawMessage.subscribe(() => (postContent.value = extractText())))
        function extractText() {
            return extractTextFromTypedMessage(opt.rawMessage.getCurrentValue()).unwrapOr('')
        }
        // #endregion

        // #region Mentioned links
        const links = new ObservableSet<string>()
        cancel.push(
            postContent.addListener((post) => {
                links.clear()
                parseURL(post).forEach((link) =>
                    links.add(resolveFacebookLink(link, activatedSocialNetworkUI.networkIdentifier)),
                )
                opt.postMentionedLinksProvider
                    ?.getCurrentValue()
                    .forEach((link) => links.add(resolveFacebookLink(link, activatedSocialNetworkUI.networkIdentifier)))
            }),
        )
        cancel.push(
            opt.postMentionedLinksProvider?.subscribe(() => {
                // Not clean old links cause post content not changed
                opt.postMentionedLinksProvider
                    ?.getCurrentValue()
                    .forEach((link) => links.add(resolveFacebookLink(link, activatedSocialNetworkUI.networkIdentifier)))
            }),
        )
        const linksSubscribe: Subscription<string[]> = debug({
            getCurrentValue: () => (links.size ? [...links] : EMPTY_LIST),
            subscribe: (sub) => links.event.on(ALL_EVENTS, sub),
        })
        // #endregion

        // #region Parse payload
        const postPayload = new ValueRef<Result<Payload, unknown>>(Err(new Error('Empty')))
        parsePayload()
        cancel.push(postContent.addListener(parsePayload))
        cancel.push(linksSubscribe.subscribe(parsePayload))
        function parsePayload() {
            // TODO: Also parse for payload in the image.
            let lastResult: Result<Payload, unknown> = Err(new Error('No candidate'))
            for (const each of (create.payloadDecoder || ((x) => [x]))(
                postContent.value + linksSubscribe.getCurrentValue().join('\n'),
            )) {
                lastResult = create.payloadParser(each)
                if (lastResult.ok) {
                    postPayload.value = lastResult
                    return
                }
            }
            if (postPayload.value.err) postPayload.value = lastResult
        }
        // #endregion
        const author: PostContextAuthor = {
            avatarURL: opt.avatarURL,
            nickname: opt.nickname,
            author: opt.author,
            snsID: opt.snsID,
        }
        const transformedPostContent = new ValueRef(makeTypedMessageTupleFromList(), isTypedMessageEqual)
        const postIdentifier = debug({
            getCurrentValue: () => {
                const by = opt.author.getCurrentValue()
                const id = opt.snsID.getCurrentValue()
                if (by.isUnknown || id === null) return null
                return new PostIdentifier(by, id)
            },
            subscribe: (sub) => {
                const a = opt.author.subscribe(sub)
                const b = opt.snsID.subscribe(sub)
                return () => void [a(), b()]
            },
        })
        const iv = new ValueRef<string | null>(null)
        const isPublicShared = new ValueRef<boolean | undefined>(undefined)
        const ownersAESKeyEncrypted = new ValueRef<string | undefined>(undefined)
        const version = new ValueRef<SupportedPayloadVersions | undefined>(undefined)
        return {
            author: author.author,
            avatarURL: author.avatarURL,
            nickname: author.nickname,
            snsID: author.snsID,

            get rootNode() {
                return opt.rootElement.realCurrent
            },
            rootElement: opt.rootElement,
            actionsElement: opt.actionsElement,
            suggestedInjectionPoint: opt.suggestedInjectionPoint,

            comment: opt.comments,

            identifier: postIdentifier,
            url: debug({
                getCurrentValue: () => {
                    const id = postIdentifier.getCurrentValue()
                    if (id) return create.getURLFromPostIdentifier?.(id) || null
                    return null
                },
                subscribe: (sub) => postIdentifier.subscribe(sub),
            }),

            mentionedLinks: linksSubscribe,
            postMetadataImages:
                opt.postImagesProvider ||
                debug({
                    getCurrentValue: () => EMPTY_LIST,
                    subscribe: () => () => {},
                }),

            rawMessage: opt.rawMessage,
            rawMessagePiped: transformedPostContent,
            postContent: SubscriptionFromValueRef(postContent),

            containingMaskPayload: SubscriptionFromValueRef(postPayload),
            iv,
            publicShared: SubscriptionFromValueRef(isPublicShared),
            ownersKeyEncrypted: SubscriptionFromValueRef(ownersAESKeyEncrypted),
            version: SubscriptionFromValueRef(version),
            decryptedReport(opts) {
                if (opts.iv) iv.value = opts.iv
                if (opts.sharedPublic?.some) isPublicShared.value = opts.sharedPublic.val
                if (opts.ownersAESKeyEncrypted) ownersAESKeyEncrypted.value = opts.ownersAESKeyEncrypted
                if (opts.version) version.value = opts.version
            },
        }
    }
}
export function createRefsForCreatePostContext() {
    const avatarURL = new ValueRef<string | null>(null)
    const nickname = new ValueRef<string | null>(null)
    const postBy = new ValueRef<ProfileIdentifier>(ProfileIdentifier.unknown, ProfileIdentifier.equals)
    const postID = new ValueRef<string | null>(null)
    const postMessage = new ValueRef<TypedMessageTuple<readonly TypedMessage[]>>(makeTypedMessageTupleFromList())
    const postMetadataImages = new ObservableSet<string>()
    const postMetadataMentionedLinks = new ObservableMap<unknown, string>()
    const subscriptions: Omit<PostContextCreation, 'rootElement' | 'actionsElement' | 'suggestedInjectionPoint'> = {
        avatarURL: mapSubscription(SubscriptionFromValueRef(avatarURL), (x) => {
            if (!x) return null
            try {
                return new URL(x)
            } catch {}
            return null
        }),
        nickname: SubscriptionFromValueRef(nickname),
        author: SubscriptionFromValueRef(postBy),
        snsID: SubscriptionFromValueRef(postID),
        rawMessage: SubscriptionFromValueRef(postMessage),
        postImagesProvider: debug({
            getCurrentValue: () => (postMetadataImages.size ? [...postMetadataImages] : EMPTY_LIST),
            subscribe: (sub) => postMetadataImages.event.on(ALL_EVENTS, sub),
        }),
        postMentionedLinksProvider: debug({
            getCurrentValue: () =>
                postMetadataMentionedLinks.size ? [...postMetadataMentionedLinks.values()] : EMPTY_LIST,
            subscribe: (sub) => postMetadataMentionedLinks.event.on(ALL_EVENTS, sub),
        }),
    }
    return {
        subscriptions,
        avatarURL,
        nickname,
        postBy,
        postID,
        postMessage,
        postMetadataMentionedLinks,
        postMetadataImages,
    }
}
