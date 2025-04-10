import Elysia, { t, error } from 'elysia';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { checkAuth } from '../middleware/authentication.middleware';
import colors from 'colors';

interface Store {
    userId: number;
    [key: string]: any;
}

interface Post {
    id: string;
    author: string;
    text: string;
    createdAt: string;
    imageUrl?: string;
    likes: number;
    comments: any[];
}

interface ClientPost {
    postId: string;
    username: string;
    content: string;
    timestamp: string;
    imageUrl?: string;
    likes: number;
    comments: any[];
}

const prisma = new PrismaClient();
const postsFilePath = path.join(__dirname, '../../data/posts.json');
const imagesDir = path.join(__dirname, '../../data/images/posts');
const publicImagePathPrefix = '/public/images/posts';

const readPosts = async (): Promise<Post[]> => {
    try {
        try {
            await fs.access(postsFilePath);
        } catch (accessError) {
            await fs.mkdir(path.dirname(postsFilePath), { recursive: true });
            await fs.writeFile(postsFilePath, '[]', 'utf-8');
            return [];
        }

        const data = await fs.readFile(postsFilePath, 'utf-8');
        if (!data.trim()) {
            return [];
        }

        const posts = (JSON.parse(data) as any[]).map((post): Post => ({
            id: post.id || uuidv4(),
            author: post.author || 'Unknown',
            text: post.text || '',
            createdAt: post.createdAt || new Date().toISOString(),
            imageUrl: post.imageUrl,
            likes: post.likes ?? 0,
            comments: post.comments ?? [],
        }));
        return posts;
    } catch (error: unknown) {
        if (error instanceof SyntaxError) {
            try {
                await fs.writeFile(postsFilePath, '[]', 'utf-8');
            } catch (writeError) {}
            return [];
        }
        throw new Error(`Could not read posts data.`);
    }
};

const writePosts = async (posts: Post[]) => {
    try {
        await fs.mkdir(path.dirname(postsFilePath), { recursive: true });
        await fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2), 'utf-8');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Could not save posts data: ${errorMessage}`);
    }
};

const getFullImageUrl = (relativeUrl?: string): string | undefined => {
    if (!relativeUrl) return undefined;
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return `${baseUrl.replace(/\/$/, '')}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
};

const PostsRoute = new Elysia({ prefix: '/posts' })
    .get('/', async ({ set }) => {
        try {
            const posts = await readPosts();
            const clientPosts: ClientPost[] = posts.map(post => ({
                postId: post.id,
                username: post.author,
                content: post.text,
                timestamp: post.createdAt,
                imageUrl: getFullImageUrl(post.imageUrl),
                likes: post.likes,
                comments: post.comments,
            }));
            clientPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            set.status = 200;
            return clientPosts;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to get posts';
            return error(500, { message });
        }
    })
    .guard({
        beforeHandle: [checkAuth]
    }, (app) => app.post('/', async (context) => {
        const { body, store, set } = context as {
            body: { content: string; image?: File },
            store: Store,
            set: { status: number }
        };

        try {
            const userId = store.userId;
            const user = await prisma.users.findUnique({
                where: { user_id: userId },
                select: { username: true },
            });

            if (!user || !user.username) {
                return context.error(404, 'Пользователь не найден');
            }

            let relativeImageUrl: string | undefined = undefined;
            let publicImageUrl: string | undefined = undefined;

            if (body.image && body.image.size > 0) {
                if (!body.image.type.startsWith('image/')) {
                    return context.error(400, 'Недопустимый тип файла. Пожалуйста, загрузите изображение.');
                }

                const fileExtension = path.extname(body.image.name) || '.jpg';
                const uniqueFilename = `${uuidv4()}${fileExtension}`;
                const savePath = path.join(imagesDir, uniqueFilename);

                try {
                    await fs.mkdir(imagesDir, { recursive: true });
                    await fs.writeFile(savePath, Buffer.from(await body.image.arrayBuffer()));

                    relativeImageUrl = `${publicImagePathPrefix}/${uniqueFilename}`;
                    publicImageUrl = getFullImageUrl(relativeImageUrl);

                } catch (fileError: any) {
                    return context.error(500, `Ошибка сохранения изображения: ${fileError.message}`);
                }
            }

            const newPost: Post = {
                id: uuidv4(),
                author: user.username,
                text: body.content,
                createdAt: new Date().toISOString(),
                imageUrl: relativeImageUrl,
                likes: 0,
                comments: [],
            };

            const posts = await readPosts();
            posts.unshift(newPost);
            await writePosts(posts);

            const clientPost: ClientPost = {
                postId: newPost.id,
                username: newPost.author,
                content: newPost.text,
                timestamp: newPost.createdAt,
                imageUrl: publicImageUrl,
                likes: newPost.likes,
                comments: newPost.comments
            };

            set.status = 201;
            return clientPost;

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
            return context.error(500, `Ошибка при создании поста: ${errorMessage}`);
        }
    }, {
        body: t.Object({
            content: t.String({ minLength: 1, error: "Текст поста не может быть пустым" }),
            image: t.Optional(t.File({
                 validator: (file) => {
                     if (file.size === 0) return true;
                     if (!file.type.startsWith('image/')) return 'Допускаются только изображения';
                     if (file.size > 5 * 1024 * 1024) return 'Максимальный размер файла 5MB';
                     return true;
                 },
                 error: "Ошибка загрузки файла изображения"
            }))
        }),
        type: 'multipart/form-data'
    })
    )
    .guard({
        beforeHandle: [checkAuth]
    }, (app) => app.post('/:postId/like', async (context) => {
        const { params, store, set } = context;
        const postId = params.postId;
        const userId = store.userId;

        try {
            const posts = await readPosts();
            const postIndex = posts.findIndex(p => p.id === postId);

            if (postIndex === -1) {
                return context.error(404, 'Пост не найден');
            }

            const post = posts[postIndex];
            post.likes = (post.likes ?? 0) + 1;

            await writePosts(posts);

            set.status = 200;
            return {
                postId: post.id,
                likes: post.likes
            };

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process like';
            return context.error(500, `Ошибка обработки лайка: ${errorMessage}`);
        }
    }, {
        params: t.Object({
            postId: t.String({ error: "Неверный ID поста в URL" })
        })
    })
    );

export default PostsRoute;
