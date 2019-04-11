import React from 'react'
import ReactDOM from 'react-dom'
import { LiveSelector, MutationObserverWatcher } from '@holoflows/kit'
import { DecryptPost } from '../../../components/InjectedComponents/DecryptedPost'
import { AddToKeyStore } from '../../../components/InjectedComponents/AddToKeyStore'
import { PeopleService } from '../rpc'
import { getUsername } from './LiveSelectors'

const posts = new LiveSelector().querySelectorAll<HTMLDivElement>('.userContent').filter((x: HTMLElement | null) => {
    while (x) {
        if (x.classList.contains('hidden_elem')) return false
        // tslint:disable-next-line: no-parameter-reassignment
        x = x.parentElement
    }
    return true
})

const PostInspector = (props: { post: string; postBy: string; postId: string; needZip(): void }) => {
    const { post, postBy, postId } = props
    const type = {
        encryptedPost: post.match('🎼') && post.match(':||'),
        provePost: post.match(/🔒(.+)🔒/)!,
    }

    if (type.encryptedPost) {
        props.needZip()
        return <DecryptPost encryptedText={post} whoAmI={getUsername()!} postBy={postBy} />
    } else if (type.provePost) {
        PeopleService.uploadProvePostUrl(postBy, postId)
        return <AddToKeyStore postBy={postBy} provePost={post} />
    }
    return null
}
new MutationObserverWatcher(posts)
    .useNodeForeach((node, key, realNode) => {
        // Get author
        const postBy = getUsername(node.current.previousElementSibling!.querySelector('a'))!
        // Save author's avatar
        try {
            const avatar = node.current.previousElementSibling!.querySelector('img')!
            PeopleService.storeAvatar(postBy, avatar.getAttribute('aria-label')!, avatar.src)
        } catch {}
        // Get post id
        let postId = ''
        try {
            const postIdInHref = location.href.match(
                /plugins.+(perma.+story_fbid%3D|posts%2F)((?<id>\d+)%26).+(&width=500)?/,
            )
            postId =
                // In single url
                (postIdInHref && postIdInHref.groups!.id) ||
                // In timeline
                node.current.previousElementSibling!.querySelector('div[id^=feed]')!.id.split(';')[2]
        } catch {}
        // Click "See more" if it may be a encrypted post
        {
            const more = node.current.parentElement!.querySelector<HTMLSpanElement>('.see_more_link_inner')
            if (more && node.current.innerText.match(/🎼.+|/)) {
                more.click()
            }
        }
        // Render it
        const render = () => {
            ReactDOM.render(
                <PostInspector
                    needZip={() => {
                        const pe = node.current.parentElement
                        if (!pe) return
                        const p = pe.querySelector('p')
                        if (!p) return
                        p.style.display = 'block'
                        p.style.maxHeight = '20px'
                        p.style.overflow = 'hidden'
                    }}
                    postId={postId}
                    post={node.current.innerText}
                    postBy={postBy}
                />,
                node.after,
            )
        }
        render()
        return {
            onNodeMutation: render,
            onRemove: () => ReactDOM.unmountComponentAtNode(node.after),
        }
    })
    .startWatch()
