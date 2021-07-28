import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import { useRouter } from 'next/router';
import { Document } from '@prismicio/client/types/documents';
import Link from 'next/link';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useUtteranc } from '../../hooks/useUtteranc';
import { ExitPreviewButton } from '../../components/ExitPreviewButton';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      };
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  previousPost: Document | null;
  nextPost: Document | null;
}

const Post: React.FC<PostProps> = ({
  post,
  preview,
  previousPost,
  nextPost,
}) => {
  const router = useRouter();

  const commentsParentId = String(router.query.slug);
  useUtteranc(commentsParentId);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const timeToRead = Math.ceil(
    post.data.content.reduce((acc, content) => {
      const splitHeading = content.heading
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/\W+/).length;
      const splitBody = RichText.asText(content.body)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/\W+/).length;

      return acc + splitHeading + splitBody;
    }, 0) / 200
  );

  return (
    <>
      <Head>
        <title>{`${post.data.title} | spacetraveling`}</title>
      </Head>

      <Header />

      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={`${post.data.title} Banner`} />
      </div>

      <div className={commonStyles.container}>
        <article className={styles.post}>
          <h2>{post.data.title}</h2>

          <div className={styles.info}>
            <div>
              <div>
                <FiCalendar />{' '}
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </div>
              <div>
                <FiUser /> {post.data.author}
              </div>
              <div>
                <FiClock /> {timeToRead} min
              </div>
            </div>

            {post.last_publication_date &&
              post.first_publication_date !== post.last_publication_date && (
                <time>
                  * editado em{' '}
                  {format(
                    new Date(post.last_publication_date),
                    "dd MMM yyyy', às' HH:mm",
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
              )}
          </div>

          {post.data.content.map(content => (
            <section key={content.heading}>
              <h3>{content.heading}</h3>

              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </section>
          ))}
        </article>

        <hr className={styles.divider} />

        <div className={styles.navigation}>
          {previousPost && (
            <Link href={`/post/${previousPost.uid}`}>
              <a className={styles.previous}>
                <h4>{previousPost.data.title}</h4>
                <span>Post anterior</span>
              </a>
            </Link>
          )}

          {nextPost && (
            <Link href={`/post/${nextPost.uid}`}>
              <a className={styles.next}>
                <h4>{nextPost.data.title}</h4>
                <span>Próximo post</span>
              </a>
            </Link>
          )}
        </div>

        <div className={styles.comments} id={commentsParentId} />

        {preview && <ExitPreviewButton />}
      </div>
    </>
  );
};

export default Post;

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {}
  );

  const posts = postsResponse.results.reduce((acc, post) => {
    return [...acc, { params: { slug: post.uid } }];
  }, []);

  return {
    paths: posts,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(params.slug), {
    ref: previewData?.ref ?? null,
  });

  const previousPost = (
    await prismic.query([Prismic.predicates.at('document.type', 'post')], {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
    })
  ).results[0];

  const nextPost = (
    await prismic.query([Prismic.predicates.at('document.type', 'post')], {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
    })
  ).results[0];

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: { url: response.data.banner.url },
      content: response.data.content.map(section => {
        return {
          heading: section.heading,
          body: section.body,
        };
      }),
    },
  };

  return {
    props: {
      post,
      preview,
      nextPost: nextPost ?? null,
      previousPost: previousPost ?? null,
    },
    revalidate: 60 * 60 * 4, // 4 hours
  };
};
