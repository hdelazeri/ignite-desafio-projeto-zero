import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useState } from 'react';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

function processPost(post): Post {
  return {
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  };
}

const Home: React.FC<HomeProps> = ({ postsPagination }) => {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadMore(): Promise<void> {
    const result = await fetch(postsPagination.next_page);
    const data = await result.json();

    const newPosts = data.results.map(processPost);
    const newNextPage = data.next_page;

    setPosts([...posts, ...newPosts]);
    setNextPage(newNextPage);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <Header />

      <div className={commonStyles.container}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a className={styles.post}>
              <h2>{post.data.title}</h2>
              <h3>{post.data.subtitle}</h3>

              <div>
                <time>
                  <FiCalendar />{' '}
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    { locale: ptBR }
                  )}
                </time>
                <span>
                  <FiUser /> {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}

        {nextPage && (
          <button
            type="button"
            className={styles.loadMore}
            onClick={handleLoadMore}
          >
            Carregar mais posts
          </button>
        )}
      </div>
    </>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { fetch: ['post.title', 'post.subtitle', 'post.author'] }
  );

  const posts: Post[] = postsResponse.results.map(processPost);

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 60 * 3, // 3 hours
  };
};
