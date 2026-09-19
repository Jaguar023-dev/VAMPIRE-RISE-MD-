import axios from 'axios';
import { addProvider } from './index';

addProvider({
  id: 'rss-default',
  type: 'news',
  name: 'Default RSS Fetcher',
  enabled: true,
  run: async ({ feed }: { feed: string }) => {
    const res = await axios.get(feed, { timeout: 20000, headers: { 'User-Agent': 'VAMPIRE-RISE-MD' } });
    const xml: string = res.data;
    const items: Array<{ title: string; link: string }> = [];
    const re = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g;
    let m;
    while ((m = re.exec(xml)) && items.length < 8) {
      items.push({ title: m[1].replace(/<!\[CDATA\[|\]\]>/g, ''), link: m[2] });
    }
    return items;
  },
});