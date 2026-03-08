#!/bin/bash

# RSS 测试脚本
# 使用方法: ./test-rss.sh

echo "=== RSS 测试工具 ==="
echo ""
echo "请输入 RSS URL 进行测试（留空使用默认 Elsevier 测试源）:"
read RSS_URL

# 如果用户没有输入，使用默认的 Elsevier 测试 URL
if [ -z "$RSS_URL" ]; then
  echo "使用默认 Elsevier 测试源..."
  RSS_URL="https://www.sciencedirect.com/search/rss"
fi

# 构建本地测试 API URL
TEST_API="http://localhost:3000/api/rss/test"

echo "正在测试 RSS: $RSS_URL"
echo ""

# 调用测试 API
curl -X POST "$TEST_API" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$RSS_URL\"}" \
  | json_pp

echo ""
echo "=== 测试完成 ==="
