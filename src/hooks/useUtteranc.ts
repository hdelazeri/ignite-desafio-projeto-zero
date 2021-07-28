import { useEffect } from 'react';

export const useUtteranc = (commentNodeId: string): void => {
  useEffect(() => {
    const scriptParentNode = document.getElementById(commentNodeId);

    if (!scriptParentNode) return () => {};

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', 'hdelazeri/ignite-desafio-05');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'comment');
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('crossorigin', 'anonymous');

    scriptParentNode.appendChild(script);

    return () => {
      scriptParentNode.removeChild(scriptParentNode.firstChild as Node);
    };
  }, [commentNodeId]);
};
