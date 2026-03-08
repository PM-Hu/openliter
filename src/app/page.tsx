'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Paper {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  tldr?: string;
  arxivId?: string;
  pdfUrl?: string;
  createdAt: Date;
}

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [arxivUrl, setArxivUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // 加载论文列表
  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const res = await fetch('/api/papers');
      const data = await res.json();
      setPapers(data);
    } catch (error) {
      console.error('加载论文失败：', error);
    }
  };

  // 添加论文
  const addPaper = async () => {
    if (!arxivUrl) return;
    setLoading(true);
    try {
      const res = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arxivUrl }),
      });
      if (res.ok) {
        setArxivUrl('');
        fetchPapers();
      } else {
        alert('添加失败，请检查链接格式');
      }
    } catch (error) {
      console.error('添加论文失败：', error);
      alert('添加失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换摘要展开/折叠
  const toggleAbstract = (id: number) => {
    setExpandedAbstracts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 删除论文
  const deletePaper = async (id: number) => {
    if (!confirm('确定要删除这篇论文吗？')) return;

    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setPapers(papers.filter(p => p.id !== id));
        alert('✅ 论文已删除');
      } else {
        alert('删除失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('删除论文失败：', error);
      alert('删除失败');
    }
  };

  // 过滤论文
  const filteredPapers = papers.filter(paper => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      paper.title.toLowerCase().includes(query) ||
      (paper.authors && paper.authors.toLowerCase().includes(query)) ||
      (paper.abstract && paper.abstract.toLowerCase().includes(query)) ||
      (paper.tldr && paper.tldr.toLowerCase().includes(query))
    );
  });

  // 生成AI摘要
  const generateSummary = async (id: number, abstract: string) => {
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abstract, paperId: id }),
      });
      const data = await res.json();
      if (data.summary) {
        setPapers(papers.map(p => p.id === id ? { ...p, tldr: data.summary } : p));
        alert('✅ 摘要已生成并保存！');
      } else {
        alert('生成摘要失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('生成摘要失败：', error);
      alert('生成摘要失败');
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">📚 个人论文助手</h1>

        {/* 搜索框 */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">🔍</span>
              <Input
                placeholder="搜索标题、作者、摘要..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                >
                  清除
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-gray-500 mt-2">
                找到 {filteredPapers.length} 篇论文
              </p>
            )}
          </CardContent>
        </Card>

        {/* 添加论文表单 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>添加论文</CardTitle>
            <CardDescription>粘贴arXiv链接自动获取论文信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="https://arxiv.org/abs/2301.07001"
                value={arxivUrl}
                onChange={(e) => setArxivUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPaper()}
              />
              <Button onClick={addPaper} disabled={loading}>
                {loading ? '添加中...' : '添加'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 论文列表 */}
        <div className="space-y-4">
          {filteredPapers.map((paper) => (
            <Card key={paper.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{paper.title}</CardTitle>
                    <CardDescription>{paper.authors}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePaper(paper.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    删除
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">📄 原始摘要：</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAbstract(paper.id)}
                      className="h-6 text-xs"
                    >
                      {expandedAbstracts.has(paper.id) ? '收起' : '展开'}
                    </Button>
                  </div>
                  {expandedAbstracts.has(paper.id) ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {paper.abstract}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {paper.abstract}
                    </p>
                  )}
                </div>

                {paper.tldr ? (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm font-medium mb-2">🤖 AI摘要：</p>
                    <p className="text-sm">{paper.tldr}</p>
                  </div>
                ) : (
                  <Button
                    onClick={() => generateSummary(paper.id, paper.abstract || '')}
                    variant="outline"
                    size="sm"
                  >
                    生成AI摘要
                  </Button>
                )}

                {paper.pdfUrl && (
                  <a
                    href={paper.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2"
                  >
                    <Button variant="link" size="sm">查看PDF</Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPapers.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            {searchQuery ? '没有找到匹配的论文' : '还没有论文，快添加第一篇吧！'}
          </div>
        )}
      </div>
    </main>
  );
}
