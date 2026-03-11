'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Paper {
  id: number;
  title: string;
  authors?: string;
  abstract?: string;
  tldr?: string;
  arxivId?: string;
  pdfUrl?: string;
  journalName?: string;
  publicationDate?: Date;
  categoryId?: number | null;
  createdAt: Date;
}

interface Category {
  id: number;
  name: string;
  color: string;
  createdAt: Date;
  _count?: {
    papers: number;
  };
}

interface RssSource {
  id: number;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: Date;
}

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // 批量选择相关状态
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // 分组相关状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');

  // RSS相关状态
  const [rssSources, setRssSources] = useState<RssSource[]>([]);
  const [showAddRssDialog, setShowAddRssDialog] = useState(false);
  const [newRssName, setNewRssName] = useState('');
  const [newRssUrl, setNewRssUrl] = useState('');
  const [rssKeywords, setRssKeywords] = useState('');
  const [testingRss, setTestingRss] = useState(false);
  const [rssTestResult, setRssTestResult] = useState<{
    success: boolean;
    message: string;
    info?: any;
  } | null>(null);

  // 保存的关键词管理
  const [savedKeywords, setSavedKeywords] = useState<Array<{ id: number; keyword: string }>>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [showAddKeywordDialog, setShowAddKeywordDialog] = useState(false);

  // 预览相关状态
  const [previewPapers, setPreviewPapers] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [selectedPreviewPapers, setSelectedPreviewPapers] = useState<Set<number>>(new Set());
  const [fetchingAbstracts, setFetchingAbstracts] = useState<Set<number>>(new Set());

  // AI简报相关状态
  const [generatingBriefing, setGeneratingBriefing] = useState(false);
  const [briefingResult, setBriefingResult] = useState<{
    content: string;
    papersCount: number;
    papers: any[];
  } | null>(null);

  // 页面导航状态
  const [currentPage, setCurrentPage] = useState<'home' | 'briefing' | 'summary' | 'repository'>('home');

  // Toast状态
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // ConfirmDialog状态
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // 显示Toast的辅助函数
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // 显示确认对话框的辅助函数
  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  // 加载数据
  useEffect(() => {
    fetchPapers();
    fetchCategories();
    fetchRssSources();
    fetchSavedKeywords();
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

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('加载分组失败：', error);
    }
  };

  const fetchRssSources = async () => {
    try {
      const res = await fetch('/api/rss/sources');
      const data = await res.json();
      setRssSources(data);
    } catch (error) {
      console.error('加载RSS源失败：', error);
    }
  };

  const fetchSavedKeywords = async () => {
    try {
      const res = await fetch('/api/keywords');
      const data = await res.json();
      setSavedKeywords(data);
    } catch (error) {
      console.error('加载关键词失败：', error);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword || newKeyword.trim().length === 0) {
      showToast('请输入关键词', 'error');
      return;
    }

    try {
      const res = await fetch('/api/keywords/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        showToast('添加失败：' + data.error, 'error');
      } else {
        setNewKeyword('');
        fetchSavedKeywords();
        showToast('✅ 关键词已添加', 'success');
        setShowAddKeywordDialog(false);
      }
    } catch (error) {
      console.error('添加关键词失败：', error);
      showToast('添加失败', 'error');
    }
  };

  const deleteKeyword = async (id: number) => {
    showConfirm('确定要删除这个关键词吗？', async () => {
      try {
        const res = await fetch(`/api/keywords/add?id=${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchSavedKeywords();
          showToast('✅ 关键词已删除', 'success');
        }
      } catch (error) {
        console.error('删除关键词失败：', error);
        showToast('删除失败', 'error');
      }
    });
  };

  const toggleKeyword = (keyword: string) => {
    if (rssKeywords.includes(keyword)) {
      // 如果已存在，移除它
      setRssKeywords(rssKeywords.split(',').filter(k => k !== keyword).join(','));
    } else {
      // 如果不存在，添加它
      const current = rssKeywords ? rssKeywords.split(',').filter(k => k.trim()) : [];
      setRssKeywords([...current, keyword].join(','));
    }
  };

  // 删除论文
  const deletePaper = async (id: number) => {
    showConfirm('确定要删除这篇论文吗？', async () => {
      try {
        const res = await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId: id }),
        });
        const data = await res.json();
        if (data.success) {
          setPapers(papers.filter(p => p.id !== id));
          fetchCategories(); // 更新分组计数
          showToast('论文已删除', 'success');
        } else {
          showToast('删除失败：' + (data.error || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('删除论文失败：', error);
        showToast('删除失败', 'error');
      }
    });
  };

  // 批量选择相关函数
  const toggleSelectPaper = (id: number) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPapers(new Set());
    } else {
      setSelectedPapers(new Set(filteredPapers.map(p => p.id)));
    }
    setIsAllSelected(!isAllSelected);
  };

  const batchDeletePapers = async () => {
    if (selectedPapers.size === 0) {
      showToast('请先选择要删除的论文', 'error');
      return;
    }

    showConfirm(`确定要删除选中的 ${selectedPapers.size} 篇论文吗？`, async () => {
      try {
        const res = await fetch('/api/papers/batch-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperIds: Array.from(selectedPapers) }),
        });
        const data = await res.json();
        if (data.success) {
          setPapers(papers.filter(p => !selectedPapers.has(p.id)));
          setSelectedPapers(new Set());
          setIsAllSelected(false);
          fetchCategories(); // 更新分组计数
          showToast(`✅ 已删除 ${data.deletedCount} 篇论文`, 'success');
        } else {
          showToast('批量删除失败：' + (data.error || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('批量删除失败：', error);
        showToast('批量删除失败', 'error');
      }
    });
  };

  // 分组管理函数
  const addCategory = async () => {
    if (!newCategoryName) {
      showToast('请输入分组名称', 'error');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
      });
      const data = await res.json();
      if (data.error) {
        showToast('添加失败：' + data.error, 'error');
      } else {
        setNewCategoryName('');
        fetchCategories();
        showToast('✅ 分组已创建', 'success');
      }
    } catch (error) {
      console.error('创建分组失败：', error);
      showToast('创建失败', 'error');
    }
  };

  const deleteCategory = async (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);

    showConfirm(`确定要删除分组"${category?.name}"吗？论文不会被删除。`, async () => {
      try {
        const res = await fetch('/api/categories/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId }),
        });
        if (res.ok) {
          fetchCategories();
          fetchPapers();
          showToast('✅ 分组已删除', 'success');
        }
      } catch (error) {
        console.error('删除分组失败：', error);
        showToast('删除失败', 'error');
      }
    });
  };

  const assignCategoryToPapers = async (categoryId: number | null) => {
    if (selectedPapers.size === 0) {
      showToast('请先选择要分组的论文', 'error');
      return;
    }

    try {
      const res = await fetch('/api/papers/assign-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperIds: Array.from(selectedPapers),
          categoryId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPapers();
        fetchCategories();
        setSelectedPapers(new Set());
        setIsAllSelected(false);
        showToast(`✅ 已将 ${data.updatedCount} 篇论文分配到分组`, 'success');
      } else {
        showToast('分配失败：' + (data.error || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('分配分组失败：', error);
      showToast('分配失败', 'error');
    }
  };

  // 过滤论文
  const filteredPapers = papers.filter(paper => {
    // 分类过滤
    if (selectedCategory !== null && paper.categoryId !== selectedCategory) {
      return false;
    }

    // 搜索过滤
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      paper.title.toLowerCase().includes(query) ||
      (paper.authors && paper.authors.toLowerCase().includes(query)) ||
      (paper.abstract && paper.abstract.toLowerCase().includes(query)) ||
      (paper.tldr && paper.tldr.toLowerCase().includes(query))
    );
  });

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
        showToast('✅ 摘要已生成并保存！', 'success');
      } else {
        showToast('生成摘要失败：' + (data.error || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('生成摘要失败：', error);
      showToast('生成摘要失败', 'error');
    }
  };

  // RSS相关函数
  const addRssSource = async () => {
    if (!newRssName || !newRssUrl) {
      showToast('请填写RSS源名称和URL', 'error');
      return;
    }

    // 检查是否已测试成功
    if (!rssTestResult?.success) {
      showToast('请先测试 RSS 源是否有效', 'error');
      return;
    }

    try {
      const res = await fetch('/api/rss/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRssName, url: newRssUrl }),
      });
      const data = await res.json();
      if (data.error) {
        showToast('添加失败：' + data.error, 'error');
      } else {
        setNewRssName('');
        setNewRssUrl('');
        setRssTestResult(null); // 清除测试结果
        fetchRssSources();
        showToast('✅ RSS源已添加', 'success');
      }
    } catch (error) {
      console.error('添加RSS源失败：', error);
      showToast('添加失败', 'error');
    }
  };

  const deleteRssSource = async (sourceId: number) => {
    showConfirm('确定要删除这个RSS源吗？', async () => {
      try {
        const res = await fetch('/api/rss/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId }),
        });
        if (res.ok) {
          fetchRssSources();
          showToast('✅ RSS源已删除', 'success');
        }
      } catch (error) {
        console.error('删除RSS源失败：', error);
        showToast('删除失败', 'error');
      }
    });
  };

  const toggleRssSource = async (sourceId: number) => {
    try {
      const source = rssSources.find(s => s.id === sourceId);
      if (!source) return;

      const res = await fetch('/api/rss/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, isActive: !source.isActive }),
      });

      if (res.ok) {
        fetchRssSources();
        showToast(source.isActive ? 'RSS源已停用' : 'RSS源已激活', 'success');
      }
    } catch (error) {
      console.error('切换RSS源状态失败：', error);
      showToast('操作失败', 'error');
    }
  };

  const generateBriefing = async () => {
    const keywords = rssKeywords.trim();
    if (!keywords) {
      showToast('请先选择或输入关键词', 'error');
      return;
    }

    setGeneratingBriefing(true);
    try {
      const res = await fetch('/api/generate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keywords,
          maxPapers: 10,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setBriefingResult({
          content: data.briefing,
          papersCount: data.papersCount,
          papers: data.papers,
        });
        showToast('✅ AI简报生成成功', 'success');
      } else {
        showToast(data.message || '生成简报失败', 'error');
      }
    } catch (error) {
      console.error('生成简报失败：', error);
      showToast('生成简报失败', 'error');
    } finally {
      setGeneratingBriefing(false);
    }
  };

  const initRssSources = async () => {
    try {
      const res = await fetch('/api/rss/init', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchRssSources();
        showToast(`✅ ${data.message}`, 'success');
      }
    } catch (error) {
      console.error('初始化RSS源失败：', error);
      showToast('初始化失败', 'error');
    }
  };

  // 测试 RSS 源
  const testRssSource = async () => {
    if (!newRssUrl) {
      showToast('请输入 RSS URL', 'error');
      return;
    }

    setTestingRss(true);
    setRssTestResult(null);

    try {
      const res = await fetch('/api/rss/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newRssUrl }),
      });

      const data = await res.json();

      if (data.success) {
        setRssTestResult({
          success: true,
          message: `✅ RSS 源有效！包含 ${data.feedInfo.totalItems} 篇论文`,
          info: data,
        });
        showToast('✅ RSS 源测试成功', 'success');
      } else {
        setRssTestResult({
          success: false,
          message: `❌ ${data.error || '无法解析 RSS 源'}`,
        });
        showToast('❌ RSS 源无效', 'error');
      }
    } catch (error) {
      console.error('测试RSS源失败：', error);
      setRssTestResult({
        success: false,
        message: '❌ 连接失败，请检查 URL',
      });
      showToast('测试失败', 'error');
    } finally {
      setTestingRss(false);
    }
  };

  // 预览 RSS 源
  const previewRss = async () => {
    setPreviewing(true);
    setPreviewPapers([]);
    setSelectedPreviewPapers(new Set());

    try {
      const sourceIds = rssSources.filter(s => s.isActive).map(s => s.id);
      if (sourceIds.length === 0) {
        showToast('请先添加并激活 RSS 源', 'error');
        return;
      }

      const res = await fetch('/api/rss/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceIds,
          keywords: rssKeywords,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPreviewPapers(data.papers);
        setShowPreview(true);
        showToast(`📰 预览完成！找到 ${data.total} 篇新论文`, 'success');
      } else {
        showToast('预览失败：' + (data.error || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('预览RSS失败：', error);
      showToast('预览失败', 'error');
    } finally {
      setPreviewing(false);
    }
  };

  // 批量添加选中的预览论文
  const addSelectedPapers = async () => {
    if (selectedPreviewPapers.size === 0) {
      showToast('请先选择要添加的论文', 'error');
      return;
    }

    try {
      const selectedPapers = previewPapers.filter((_, index) =>
        selectedPreviewPapers.has(index)
      );

      const res = await fetch('/api/rss/add-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ papers: selectedPapers }),
      });

      const data = await res.json();

      if (data.success) {
        fetchPapers();
        fetchCategories();
        setShowPreview(false);
        setPreviewPapers([]);
        setSelectedPreviewPapers(new Set());
        showToast(`✅ 成功添加 ${data.addedCount} 篇论文`, 'success');
      } else {
        showToast('添加失败：' + (data.error || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('批量添加论文失败：', error);
      showToast('添加失败', 'error');
    }
  };

  // 切换预览论文选择
  const togglePreviewPaper = (index: number) => {
    setSelectedPreviewPapers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // 全选/取消全选预览论文
  const toggleSelectAllPreview = () => {
    if (selectedPreviewPapers.size === previewPapers.length) {
      setSelectedPreviewPapers(new Set());
    } else {
      setSelectedPreviewPapers(new Set(previewPapers.map((_, i) => i)));
    }
  };

  // 为预览论文获取摘要
  const fetchAbstractForPaper = async (index: number) => {
    setFetchingAbstracts(prev => new Set([...prev, index]));

    try {
      const paper = previewPapers[index];
      const res = await fetch('/api/rss/fetch-abstract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: paper.title }),
      });

      const data = await res.json();

      if (data.success) {
        // 更新论文的摘要和作者
        setPreviewPapers(prev => prev.map((p, i) =>
          i === index
            ? {
                ...p,
                abstract: data.abstract.substring(0, 500),
                authors: data.authors || p.authors,
                hasAbstract: true,
              }
            : p
        ));
        showToast('✅ 摘要已获取', 'success');
      } else {
        showToast('获取失败：' + (data.error || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('获取摘要失败：', error);
      showToast('获取摘要失败', 'error');
    } finally {
      setFetchingAbstracts(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold">📚 论文助手</h1>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage('home')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'home'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🏠 首页
                </button>
                <button
                  onClick={() => setCurrentPage('briefing')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'briefing'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🤖 AI简报
                </button>
                <button
                  onClick={() => setCurrentPage('summary')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'summary'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ✨ AI摘要
                </button>
                <button
                  onClick={() => setCurrentPage('repository')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'repository'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📖 文献仓库
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 根据当前页面显示不同内容 */}
      {currentPage === 'home' && (
        <div className="max-w-6xl mx-auto p-8">
          {/* 欢迎区域 */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">欢迎使用论文助手 🎓</h2>
            <p className="text-gray-600 text-lg">
              智能科研助手，帮您快速获取、管理和分析学术论文
            </p>
          </div>

          {/* 功能入口卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card
              className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-2 hover:border-blue-400"
              onClick={() => setCurrentPage('briefing')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <CardTitle className="text-xl">AI研究简报</CardTitle>
                <CardDescription>
                  基于关键词智能分析多篇论文，生成结构化研究简报
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 智能论文匹配</li>
                  <li>• 研究趋势分析</li>
                  <li>• 关键发现提取</li>
                  <li>• 推荐阅读建议</li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-2 hover:border-purple-400"
              onClick={() => setCurrentPage('summary')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <CardTitle className="text-xl">AI论文摘要</CardTitle>
                <CardDescription>
                  为单篇论文生成AI摘要，快速理解核心内容
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 智能摘要生成</li>
                  <li>• 核心观点提取</li>
                  <li>• 研究方法分析</li>
                  <li>• 快速文献筛选</li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-2 hover:border-green-400"
              onClick={() => setCurrentPage('repository')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📖</span>
                </div>
                <CardTitle className="text-xl">文献仓库</CardTitle>
                <CardDescription>
                  管理您的论文库，支持搜索、分组和批量操作
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 论文搜索筛选</li>
                  <li>• 分组管理</li>
                  <li>• 批量操作</li>
                  <li>• RSS订阅</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{papers.length}</p>
                  <p className="text-sm text-gray-600 mt-2">已收集论文</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
                  <p className="text-sm text-gray-600 mt-2">分组数量</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{rssSources.filter(s => s.isActive).length}</p>
                  <p className="text-sm text-gray-600 mt-2">RSS订阅</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {currentPage === 'repository' && (
        <div className="flex">
          {/* 左侧边栏 */}
          <aside className="w-64 bg-white border-r p-4 sticky top-0 h-screen overflow-y-auto">
            <h1 className="text-xl font-bold mb-6">📁 分组管理</h1>

          {/* 分组列表 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">📁 分组</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-xs"
              >
                + 新建
              </Button>
            </div>

            {showAddCategory && (
              <div className="mb-3 p-3 bg-gray-50 rounded space-y-2">
                <Input
                  placeholder="分组名称"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                  <Button
                    size="sm"
                    onClick={addCategory}
                    className="flex-1"
                  >
                    创建
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between ${
                  selectedCategory === null ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <span>📄 全部论文</span>
                <span className="text-xs text-gray-500">{papers.length}</span>
              </button>

              {categories.map((category) => (
                <div key={category.id} className="group">
                  <button
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between ${
                      selectedCategory === category.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500">{category._count?.papers || 0}</span>
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="hidden group-hover:block absolute right-2 text-red-500 hover:text-red-700"
                    style={{ marginTop: '-24px', marginRight: '8px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 批量操作 */}
          {selectedPapers.size > 0 && (
            <div className="mb-6 p-3 bg-blue-50 rounded">
              <p className="text-xs font-medium mb-2">已选 {selectedPapers.size} 篇</p>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 mb-1">分配到分组：</p>
                <button
                  onClick={() => assignCategoryToPapers(null)}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-blue-100 rounded"
                >
                  移除分组
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => assignCategoryToPapers(category.id)}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-blue-100 rounded flex items-center gap-2"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* 主内容区 */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* 搜索和添加RSS按钮 */}
            <Card className="mb-4 sticky top-0 z-10">
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

            {/* 预览论文面板 */}
            {showPreview && (
              <Card className="mb-8 border-2 border-purple-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>📑 预览新论文</CardTitle>
                      <CardDescription>选择要添加的论文 ({selectedPreviewPapers.size} / {previewPapers.length})</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowPreview(false);
                        setPreviewPapers([]);
                        setSelectedPreviewPapers(new Set());
                      }}
                    >
                      ✕ 关闭
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 全选和批量操作 */}
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPreviewPapers.size === previewPapers.length}
                          onChange={toggleSelectAllPreview}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">
                          {selectedPreviewPapers.size === previewPapers.length ? '取消全选' : '全选'}
                        </span>
                      </div>
                      <Button
                        onClick={addSelectedPapers}
                        disabled={selectedPreviewPapers.size === 0}
                        size="sm"
                      >
                        ✅ 添加选中的 ({selectedPreviewPapers.size})
                      </Button>
                    </div>

                    {/* 论文列表 */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {previewPapers.map((paper, index) => (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg transition-colors ${
                            selectedPreviewPapers.has(index)
                              ? 'bg-purple-50 border-purple-300'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedPreviewPapers.has(index)}
                              onChange={() => togglePreviewPaper(index)}
                              className="w-4 h-4 mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium mb-1 line-clamp-2">{paper.title}</h4>
                              <p className="text-xs text-gray-600 mb-1">👤 {paper.authors}</p>
                              {(paper.journalName || paper.publicationDate || paper.pubDate) && (
                                <div className="flex items-center gap-2 mb-1">
                                  {paper.journalName && (
                                    <span className="text-xs text-purple-700">📚 {paper.journalName}</span>
                                  )}
                                  {(paper.publicationDate || paper.pubDate) && (
                                    <span className="text-xs text-gray-400">
                                      📅 {new Date(paper.publicationDate || paper.pubDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {paper.abstract || '暂无摘要'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  {paper.sourceName}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={fetchingAbstracts.has(index)}
                                  onClick={() => fetchAbstractForPaper(index)}
                                  className="text-xs h-7"
                                >
                                  {fetchingAbstracts.has(index) ? '获取中...' : '📥 获取摘要'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {previewPapers.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        没有找到新论文
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 论文列表 */}
            {filteredPapers.length > 0 && (
              <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    {selectedPapers.size > 0
                      ? `已选择 ${selectedPapers.size} 篇论文`
                      : `全选 (${filteredPapers.length} 篇)`}
                  </span>
                </div>
                {selectedPapers.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={batchDeletePapers}
                  >
                    🗑️ 批量删除 ({selectedPapers.size})
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-4">
              {filteredPapers.map((paper) => {
                const category = categories.find(c => c.id === paper.categoryId);
                return (
                  <Card
                    id={`paper-${paper.id}`}
                    key={paper.id}
                    className={selectedPapers.has(paper.id) ? 'ring-2 ring-blue-500' : ''}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPapers.has(paper.id)}
                          onChange={() => toggleSelectPaper(paper.id)}
                          className="w-4 h-4 mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{paper.title}</CardTitle>
                            {category && (
                              <span
                                className="text-xs px-2 py-1 rounded text-white"
                                style={{ backgroundColor: category.color }}
                              >
                                {category.name}
                              </span>
                            )}
                          </div>
                          <CardDescription className="mb-1">{paper.authors}</CardDescription>
                          {(paper.journalName || paper.publicationDate) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {paper.journalName && (
                                <span>📚 {paper.journalName}</span>
                              )}
                              {paper.publicationDate && (
                                <span>📅 {new Date(paper.publicationDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePaper(paper.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X size={16} />
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
                );
              })}
            </div>

            {filteredPapers.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                {searchQuery ? '没有找到匹配的论文' : '还没有论文，快添加第一篇吧！'}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* AI简报页面 */}
      {currentPage === 'briefing' && (
        <div className="max-w-6xl mx-auto p-8 space-y-6">
          {/* RSS订阅管理 */}
          <Card>
            <CardHeader>
              <CardTitle>📰 RSS订阅管理</CardTitle>
              <CardDescription>订阅学术期刊RSS源，收集最新论文</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* RSS源列表 */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">已订阅源</h3>
                  {rssSources.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-gray-500 mb-4">还没有RSS订阅</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddRssDialog(true)}
                      >
                        ➕ 添加第一个RSS源
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {rssSources.map((source) => (
                          <div
                            key={source.id}
                            onClick={() => toggleRssSource(source.id)}
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              source.isActive
                                ? 'bg-blue-50 border-blue-300'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                                    source.isActive
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-300 text-gray-500'
                                  }`}>
                                    {source.isActive ? '✓' : '○'}
                                  </div>
                                  <h3 className={`text-sm font-medium truncate ${
                                    source.isActive ? 'text-blue-900' : 'text-gray-600'
                                  }`}>{source.name}</h3>
                                </div>
                                <p className="text-xs text-gray-500 truncate" title={source.url}>{source.url}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRssSource(source.id);
                                }}
                                className="text-red-500 hover:text-red-700 p-1 h-auto ml-2 flex-shrink-0"
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddRssDialog(true)}
                        className="w-full mt-3"
                      >
                        + 添加RSS源
                      </Button>
                    </>
                  )}
                </div>

                {/* 关键词（选中后筛选） */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">🏷️ 关键词（选中后筛选）</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddKeywordDialog(true)}
                      className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      ➕ 添加
                    </Button>
                  </div>
                  <div>
                    {savedKeywords.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">还没有保存的关键词</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {savedKeywords.map((kw) => {
                          const isSelected = rssKeywords.split(',').map(k => k.trim()).includes(kw.keyword);
                          return (
                            <button
                              key={kw.id}
                              onClick={() => toggleKeyword(kw.keyword)}
                              className={`px-3 py-2 rounded-full border transition-colors flex items-center gap-1 text-[14px] ${
                                isSelected
                                  ? 'bg-green-100 border-green-300 text-green-700'
                                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}{kw.keyword}
                              <X
                                size={12}
                                className="hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteKeyword(kw.id);
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              {rssSources.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={previewRss}
                      disabled={previewing || rssSources.filter(s => s.isActive).length === 0}
                      className="w-full"
                    >
                      {previewing ? '🔄 预览中...' : '👀 预览新论文'}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={generateBriefing}
                      disabled={generatingBriefing}
                      className="w-full"
                    >
                      {generatingBriefing ? '🔄 生成中...' : '🤖 生成AI简报'}
                    </Button>
                  </div>
                  {showPreview && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full mt-3 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                    >
                      📋 查看预览论文 ({previewPapers.length}篇)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 最近的简报 */}
          {briefingResult && (
            <Card>
              <CardHeader>
                <CardTitle>📋 最新简报</CardTitle>
                <CardDescription>基于 {briefingResult.papersCount} 篇论文生成</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                    {briefingResult.content}
                  </div>
                </div>

                {/* 相关论文列表 */}
                {briefingResult.papers && briefingResult.papers.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-3">📚 相关论文</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {briefingResult.papers.map((paper: any) => (
                        <div
                          key={paper.id}
                          className="p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setCurrentPage('repository');
                            // 滚动到该论文
                            setTimeout(() => {
                              const element = document.getElementById(`paper-${paper.id}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                element.classList.add('ring-2', 'ring-blue-500');
                                setTimeout(() => {
                                  element.classList.remove('ring-2', 'ring-blue-500');
                                }, 2000);
                              }
                            }, 100);
                          }}
                        >
                          <h4 className="text-sm font-medium line-clamp-2 mb-2">{paper.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            {paper.journalName && (
                              <span>📚 {paper.journalName}</span>
                            )}
                            {paper.publicationDate && (
                              <span>📅 {new Date(paper.publicationDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* AI摘要页面 */}
      {currentPage === 'summary' && (
        <div className="max-w-4xl mx-auto p-8">
          <Card>
            <CardHeader>
              <CardTitle>✨ AI论文摘要</CardTitle>
              <CardDescription>为单篇论文生成智能摘要</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  💡 提示：请先在文献仓库中选择要生成摘要的论文
                </p>
                <Button
                  onClick={() => setCurrentPage('repository')}
                  variant="outline"
                  className="w-full"
                >
                  📖 前往文献仓库选择论文
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toast组件 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ConfirmDialog组件 */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* RSS添加对话框 */}
      {showAddRssDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">📰 添加RSS订阅</h2>
                <button
                  onClick={() => {
                    setShowAddRssDialog(false);
                    setNewRssName('');
                    setNewRssUrl('');
                    setRssTestResult(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">RSS源名称</label>
                  <Input
                    placeholder="如：arXiv AI"
                    value={newRssName}
                    onChange={(e) => setNewRssName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">RSS URL</label>
                  <Input
                    placeholder="如：https://export.arxiv.org/rss/cs.AI"
                    value={newRssUrl}
                    onChange={(e) => setNewRssUrl(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={testRssSource}
                    disabled={testingRss || !newRssUrl}
                    variant="outline"
                    className="flex-1"
                  >
                    {testingRss ? '🔄 测试中...' : '🧪 测试连接'}
                  </Button>
                  <Button
                    onClick={addRssSource}
                    disabled={!rssTestResult?.success}
                    className="flex-1"
                  >
                    ➕ 添加
                  </Button>
                </div>

                {/* 测试结果 */}
                {rssTestResult && (
                  <div className={`p-4 rounded-lg ${
                    rssTestResult.success
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium mb-2">{rssTestResult.message}</p>
                        {rssTestResult.success && rssTestResult.info && (
                          <div className="text-sm space-y-1">
                            <p>📰 <strong>标题:</strong> {rssTestResult.info.feedInfo.title}</p>
                            <p>📝 <strong>描述:</strong> {rssTestResult.info.feedInfo.description?.substring(0, 100)}...</p>
                            <p>📊 <strong>论文数量:</strong> {rssTestResult.info.feedInfo.totalItems}</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setRssTestResult(null)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 预设RSS源 */}
                {rssSources.length === 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">快速添加预设源：</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={initRssSources}
                        className="text-xs"
                      >
                        🎯 加载所有预设RSS源
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 关键词添加对话框 */}
      {showAddKeywordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">🏷️ 添加关键词</h2>
                <button
                  onClick={() => {
                    setShowAddKeywordDialog(false);
                    setNewKeyword('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">关键词名称</label>
                  <Input
                    placeholder="输入关键词（如：深度学习、量子计算等）"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newKeyword.trim()) {
                        addKeyword();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddKeywordDialog(false);
                      setNewKeyword('');
                    }}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={addKeyword}
                    disabled={!newKeyword.trim()}
                    className="flex-1"
                  >
                    添加
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 预览论文弹出对话框 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 对话框标题 */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">📑 预览新论文</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    选择要添加的论文 ({selectedPreviewPapers.size} / {previewPapers.length})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewPapers([]);
                    setSelectedPreviewPapers(new Set());
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* 对话框内容 - 可滚动 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 全选和批量操作 */}
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedPreviewPapers.size === previewPapers.length}
                    onChange={toggleSelectAllPreview}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">
                    {selectedPreviewPapers.size === previewPapers.length ? '取消全选' : '全选'}
                  </span>
                </div>
                <Button
                  onClick={addSelectedPapers}
                  disabled={selectedPreviewPapers.size === 0}
                  size="sm"
                >
                  ✅ 添加选中的 ({selectedPreviewPapers.size})
                </Button>
              </div>

              {/* 论文列表 */}
              <div className="space-y-3">
                {previewPapers.map((paper, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg transition-colors ${
                      selectedPreviewPapers.has(index)
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPreviewPapers.has(index)}
                        onChange={() => togglePreviewPaper(index)}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium mb-1 line-clamp-2">{paper.title}</h4>
                        <p className="text-xs text-gray-600 mb-1">👤 {paper.authors}</p>
                        {(paper.journalName || paper.publicationDate) && (
                          <div className="flex items-center gap-2 mb-1">
                            {paper.journalName && (
                              <span className="text-xs text-purple-700">📚 {paper.journalName}</span>
                            )}
                            {(paper.publicationDate || paper.pubDate) && (
                              <span className="text-xs text-gray-400">
                                📅 {new Date(paper.publicationDate || paper.pubDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {paper.abstract || '暂无摘要'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {paper.sourceName}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={fetchingAbstracts.has(index)}
                            onClick={() => fetchAbstractForPaper(index)}
                            className="text-xs h-7"
                          >
                            {fetchingAbstracts.has(index) ? '获取中...' : '📥 获取摘要'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
