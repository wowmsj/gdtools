# -*- coding: utf-8 -*-
"""
UI 主题升级脚本：为 gacha_web_simple.html 与 templates/full.html 应用
「星轨祈愿」暗色高级感主题。只做标记替换，不动任何 JS 功能逻辑。
重复执行安全（幂等）：已替换过的标记会被跳过。
"""
import io
import sys

FILES = ['gacha_web_simple.html', 'templates/full.html']

NEW_TITLE = '<title>星轨祈愿 · 抽卡模拟器</title>'

FONT_LINKS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Serif+SC:wght@700;900&display=swap" rel="stylesheet">'
)

BG_SCENE = (
    '<div class="bg-scene" aria-hidden="true">\n'
    '        <div class="bg-orb bg-orb-1"></div>\n'
    '        <div class="bg-orb bg-orb-2"></div>\n'
    '        <div class="bg-stars"></div>\n'
    '    </div>\n'
    '    '
)

HERO = (
    '<header class="hero">\n'
    '            <div class="hero-eyebrow">Gacha Probability Lab</div>\n'
    '            <h1 class="hero-title">星轨祈愿 · 抽卡模拟器</h1>\n'
    '            <p class="hero-subtitle">概率建模 · 保底机制 · 用户行为模拟，一站式数值验证工作台</p>\n'
    '        </header>'
)

CHART_DEFAULTS = (
    '<script>\n'
    '        // 全局图表配色（配合暗色主题）\n'
    '        if (window.Chart) {\n'
    "            Chart.defaults.color = 'rgba(226, 232, 245, 0.72)';\n"
    "            Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';\n"
    '            Chart.defaults.font.family = "\'Noto Sans SC\', -apple-system, \'PingFang SC\', \'Microsoft YaHei\', sans-serif";\n'
    '        }\n'
    '    </script>'
)

NEW_CSS = """
        /* ============ 星轨祈愿 · 设计系统 ============ */
        :root {
            --bg: #0a0d18;
            --panel: rgba(255, 255, 255, 0.045);
            --panel-deep: rgba(10, 13, 24, 0.55);
            --line: rgba(255, 255, 255, 0.09);
            --line-strong: rgba(255, 255, 255, 0.16);
            --text: #e8ecf6;
            --muted: #99a2b8;
            --gold: #e7c37a;
            --gold-deep: #c99f4a;
            --gold-grad: linear-gradient(135deg, #f4da99, #d3a24b);
            --gold-glow: rgba(222, 178, 92, 0.32);
            --radius: 14px;
        }

        html { color-scheme: dark; }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: 'Noto Sans SC', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
        }

        ::selection { background: rgba(231, 195, 122, 0.35); }

        /* ---- 背景氛围 ---- */
        .bg-scene {
            position: fixed; inset: 0; z-index: -1; overflow: hidden;
            background:
                radial-gradient(1100px 560px at 82% -8%, rgba(72, 94, 196, 0.22), transparent 62%),
                radial-gradient(880px 520px at 8% 108%, rgba(196, 148, 62, 0.13), transparent 60%),
                var(--bg);
        }
        .bg-orb { position: absolute; border-radius: 50%; filter: blur(90px); }
        .bg-orb-1 { width: 480px; height: 480px; top: -170px; right: -130px;
            background: radial-gradient(circle, rgba(92, 112, 224, 0.42), transparent 70%); }
        .bg-orb-2 { width: 440px; height: 440px; bottom: -160px; left: -110px;
            background: radial-gradient(circle, rgba(224, 172, 82, 0.30), transparent 70%); }
        .bg-stars { position: absolute; inset: 0; opacity: 0.55;
            background-image:
                radial-gradient(1.5px 1.5px at 12% 22%, rgba(255,255,255,0.7), transparent),
                radial-gradient(1px 1px at 32% 68%, rgba(255,255,255,0.45), transparent),
                radial-gradient(1.5px 1.5px at 47% 12%, rgba(255,255,255,0.55), transparent),
                radial-gradient(1px 1px at 63% 42%, rgba(255,255,255,0.4), transparent),
                radial-gradient(1.5px 1.5px at 78% 26%, rgba(255,255,255,0.6), transparent),
                radial-gradient(1px 1px at 88% 74%, rgba(255,255,255,0.45), transparent),
                radial-gradient(1px 1px at 22% 86%, rgba(255,255,255,0.4), transparent),
                radial-gradient(1.5px 1.5px at 55% 88%, rgba(255,255,255,0.5), transparent);
        }

        .container { max-width: 1120px; margin-top: 26px; padding-bottom: 64px; }

        /* ---- 顶部 Hero ---- */
        .hero { text-align: center; padding: 16px 0 28px; }
        .hero-eyebrow {
            font-size: 12px; letter-spacing: 0.45em; text-transform: uppercase;
            color: var(--gold); opacity: 0.85; text-indent: 0.45em;
        }
        .hero-title {
            font-family: 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
            font-size: 42px; font-weight: 900; letter-spacing: 0.06em;
            margin: 12px 0 10px;
            background: linear-gradient(120deg, #fdf3d3 10%, #eccb84 48%, #c99f4a 90%);
            -webkit-background-clip: text; background-clip: text; color: transparent;
            text-shadow: 0 0 42px rgba(231, 195, 122, 0.18);
        }
        .hero-subtitle { color: var(--muted); font-size: 14px; letter-spacing: 0.14em; margin: 0; }
        .hero::after {
            content: ''; display: block; width: 132px; height: 2px; margin: 20px auto 0;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
            border-radius: 2px;
        }

        /* ---- 主卡片 ---- */
        .card {
            background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.028));
            border: 1px solid var(--line);
            border-radius: 18px;
            color: var(--text);
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
        }
        .card-body { padding: 28px; }
        .tab-pane > .card, .card .card {
            background: rgba(10, 13, 24, 0.35);
            box-shadow: none;
        }
        .card-header, .card-header.bg-primary {
            background: rgba(231, 195, 122, 0.07) !important;
            border-bottom: 1px solid rgba(231, 195, 122, 0.25);
            border-radius: 18px 18px 0 0 !important;
            padding: 14px 20px;
        }
        .card-header h5 { color: #f0e3c2; }

        /* ---- 功能页签（分段控件风格 + 吸顶） ---- */
        #functionTabs {
            position: sticky; top: 12px; z-index: 30;
        }
        .nav-tabs {
            border-bottom: none; gap: 6px; flex-wrap: nowrap; overflow-x: auto;
            background: rgba(10, 13, 24, 0.72);
            border: 1px solid var(--line);
            border-radius: 14px; padding: 6px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            scrollbar-width: none;
        }
        .nav-tabs::-webkit-scrollbar { display: none; }
        .nav-tabs .nav-item { flex: 0 0 auto; }
        .nav-tabs .nav-link {
            border: none; border-radius: 10px; background: transparent;
            color: var(--muted); font-weight: 500; white-space: nowrap;
            padding: 9px 18px; transition: color 0.18s, background 0.18s, box-shadow 0.18s;
        }
        .nav-tabs .nav-link:hover { color: var(--text); background: rgba(255,255,255,0.05); }
        .nav-tabs .nav-link.active {
            background: var(--gold-grad); color: #241a06; font-weight: 700;
            box-shadow: 0 4px 18px var(--gold-glow);
        }
        /* 高级配置内的概率页签：次级尺寸 */
        #probTabs { padding: 4px; gap: 4px; }
        #probTabs .nav-link { padding: 6px 14px; font-size: 13px; }

        /* ---- 标题与文字 ---- */
        h5 {
            color: #f0e3c2; font-weight: 700; letter-spacing: 0.04em;
            display: flex; align-items: center; gap: 10px;
        }
        h5::before {
            content: ''; flex: 0 0 auto; width: 4px; height: 16px; border-radius: 2px;
            background: linear-gradient(180deg, #f2d896, #c99f4a);
        }
        h5.mb-0 { margin-bottom: 0; }
        .text-primary { color: var(--gold) !important; }
        .text-muted { color: var(--muted) !important; }
        .text-success { color: #4ade80 !important; }
        .text-danger { color: #f87171 !important; }
        .font-weight-bold { font-weight: 700; }
        label, .form-label { color: #c3cadb; font-weight: 500; font-size: 14px; margin-bottom: 6px; }
        .help-text, .form-text { color: #8b93a7; font-size: 12px; }
        mark { background: rgba(246, 196, 101, 0.26); color: #ffe3a1; padding: 0 6px; border-radius: 4px; }
        code { background: rgba(255,255,255,0.08); color: #9ee6c0; padding: 2px 8px; border-radius: 6px; font-size: 13px; }

        /* ---- 表单控件 ---- */
        .form-group { margin-bottom: 16px; }
        .form-control, .form-select {
            background-color: var(--panel-deep);
            border: 1px solid var(--line-strong);
            color: var(--text);
            border-radius: 10px;
            padding: 9px 13px;
            transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .form-control:focus, .form-select:focus {
            background-color: rgba(10, 13, 24, 0.75);
            border-color: var(--gold);
            box-shadow: 0 0 0 3px rgba(231, 195, 122, 0.16);
            color: var(--text);
        }
        .form-control:disabled, .form-select:disabled { background-color: rgba(255,255,255,0.04); color: var(--muted); }
        .form-select {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%2399a2b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3E%3C/svg%3E");
        }
        .form-select option { background: #131828; color: var(--text); }
        ::placeholder { color: #65708a !important; opacity: 1; }
        input[type='number'] { color-scheme: dark; }
        .input-group-text {
            background: rgba(255,255,255,0.06);
            border: 1px solid var(--line-strong);
            color: var(--muted); font-size: 13px;
        }
        .form-check-input {
            background-color: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.3);
        }
        .form-check-input:checked { background-color: #d9ab52; border-color: #d9ab52; }
        .form-check-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(231,195,122,0.18); }
        .form-check-label { color: var(--text); font-weight: 400; }

        /* ---- 按钮 ---- */
        .btn {
            border-radius: 10px; font-weight: 600; letter-spacing: 0.02em;
            border: 1px solid transparent;
            transition: transform 0.16s, filter 0.16s, box-shadow 0.16s, background 0.16s, color 0.16s;
        }
        .btn:not(:disabled):hover { transform: translateY(-1px); }
        .btn:not(:disabled):active { transform: translateY(0); }
        .btn-primary {
            background: var(--gold-grad); color: #241a06;
            box-shadow: 0 6px 20px rgba(222, 178, 92, 0.28);
        }
        .btn-primary:hover, .btn-primary:focus { color: #241a06; filter: brightness(1.07); }
        .btn-success { background: linear-gradient(135deg, #3ddc97, #1d9e6c); color: #06281b; }
        .btn-success:hover, .btn-success:focus { color: #06281b; filter: brightness(1.08); }
        .btn-danger {
            background: rgba(248, 113, 113, 0.13);
            border-color: rgba(248, 113, 113, 0.45); color: #fca5a5;
        }
        .btn-danger:hover, .btn-danger:focus { background: rgba(248, 113, 113, 0.26); color: #fecaca; }
        .btn-secondary {
            background: rgba(255,255,255,0.08);
            border-color: var(--line-strong); color: var(--text);
        }
        .btn-secondary:hover, .btn-secondary:focus { background: rgba(255,255,255,0.14); color: #fff; }
        .btn-info {
            background: rgba(56, 189, 248, 0.14);
            border-color: rgba(56, 189, 248, 0.4); color: #7dd3fc;
        }
        .btn-info:hover, .btn-info:focus { background: rgba(56, 189, 248, 0.26); color: #bae6fd; }
        .btn:disabled { opacity: 0.45; }
        .btn-sm-custom { padding: 3px 10px; font-size: 12px; border-radius: 8px; }
        .btn-group { gap: 8px; }

        /* ---- 配置区块 ---- */
        .config-section {
            background: rgba(255,255,255,0.032);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 22px;
            margin-bottom: 22px;
        }

        /* ---- 表格 ---- */
        .table {
            --bs-table-bg: transparent;
            --bs-table-color: var(--text);
            --bs-table-border-color: rgba(255,255,255,0.08);
            --bs-table-striped-bg: rgba(255,255,255,0.028);
            --bs-table-striped-color: var(--text);
            --bs-table-hover-bg: rgba(231,195,122,0.06);
            --bs-table-hover-color: var(--text);
            color: var(--text);
            margin-bottom: 12px;
        }
        .table thead th {
            color: #ecd9a8; font-size: 12px; font-weight: 700;
            letter-spacing: 0.08em;
            background: rgba(231, 195, 122, 0.05);
            border-bottom: 1px solid rgba(231, 195, 122, 0.3);
            padding: 10px 12px;
        }
        .table td { padding: 9px 12px; vertical-align: middle; }
        .table-bordered, .table-bordered th, .table-bordered td { border-color: rgba(255,255,255,0.08); }
        .config-table input, .table td input {
            width: 100%;
            background: var(--panel-deep);
            border: 1px solid var(--line-strong);
            color: var(--text);
            border-radius: 8px;
            padding: 6px 10px;
            transition: border-color 0.18s, box-shadow 0.18s;
        }
        .config-table input:focus, .table td input:focus {
            outline: none;
            border-color: var(--gold);
            box-shadow: 0 0 0 3px rgba(231, 195, 122, 0.16);
        }
        .table-container { margin-top: 16px; overflow-x: auto; border-radius: 12px; }
        .table-responsive { border-radius: 12px; }

        /* ---- 勾选列表 / 目标树 ---- */
        #real_user_scope_list, #draw_scope_list {
            background: rgba(10, 13, 24, 0.5) !important;
            border-color: var(--line-strong) !important;
            border-radius: 12px !important;
        }
        .tree-container {
            background: rgba(10, 13, 24, 0.5);
            border-color: var(--line-strong) !important;
            border-radius: 12px !important;
        }

        /* ---- 结果区 ---- */
        .result-section, .draw-result {
            margin-top: 26px;
            padding: 24px;
            background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
            border: 1px solid rgba(231, 195, 122, 0.22);
            border-radius: 16px;
            box-shadow: 0 18px 44px rgba(0, 0, 0, 0.35);
            animation: riseIn 0.45s ease both;
        }
        @keyframes riseIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: none; }
        }
        .result-section h2, .result-section h3 {
            font-family: 'Noto Serif SC', 'Songti SC', serif;
            color: #f0e3c2; letter-spacing: 0.04em;
        }
        .result-section h3 { font-size: 20px; margin-top: 22px; }

        .core-stats { margin-bottom: 20px; }
        .core-stats .stat-item {
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 10px;
        }
        .core-stats .stat-label {
            font-weight: 600; color: var(--gold);
            display: inline-block; width: auto; margin-right: 10px;
        }
        .core-stats .stat-item span:last-child { color: #fff; font-weight: 600; }

        .draw-item {
            display: inline-block;
            background: rgba(255,255,255,0.06);
            border: 1px solid var(--line-strong);
            color: var(--text);
            border-radius: 999px;
            padding: 4px 14px;
            margin: 4px;
            font-weight: 600; font-size: 13px;
        }
        .draw-item.ur {
            border-color: rgba(246, 196, 101, 0.6);
            background: linear-gradient(135deg, rgba(246,196,101,0.22), rgba(217,90,90,0.16));
            color: #ffd98f;
            box-shadow: 0 0 14px rgba(246, 196, 101, 0.25);
        }
        .draw-item.ssr {
            border-color: rgba(52, 211, 153, 0.55);
            background: rgba(52, 211, 153, 0.14);
            color: #7df0c2;
        }
        .draw-item.sr {
            border-color: rgba(56, 189, 248, 0.5);
            background: rgba(56, 189, 248, 0.12);
            color: #8fd8fb;
        }

        /* ---- 加载进度 ---- */
        #loading {
            display: none;
            text-align: center; margin: 22px 0;
            background: rgba(10, 13, 24, 0.6);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 26px;
            backdrop-filter: blur(8px);
        }
        .progress {
            height: 10px;
            background: rgba(255,255,255,0.08);
            border-radius: 999px;
            overflow: hidden;
        }
        .progress-bar {
            background: var(--gold-grad);
            border-radius: 999px;
            box-shadow: 0 0 12px var(--gold-glow);
        }
        #loadingText { color: var(--muted); margin: 0; letter-spacing: 0.06em; }

        /* ---- 规则说明页 ---- */
        .alert { border-radius: 12px; border: 1px solid; padding: 14px 18px; }
        .alert-info {
            background: rgba(56, 189, 248, 0.10);
            border-color: rgba(56, 189, 248, 0.3);
            color: #bfe6fb;
        }
        .alert-warning {
            background: rgba(246, 196, 101, 0.10);
            border-color: rgba(246, 196, 101, 0.32);
            color: #f3dfae;
        }
        .alert strong { color: inherit; }

        .rarity-prob-sum-warning { color: #fbbf24; }

        /* ---- 滚动条 ---- */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.14);
            border-radius: 999px;
            border: 2px solid transparent;
            background-clip: content-box;
        }
        ::-webkit-scrollbar-thumb:hover { background: rgba(231,195,122,0.4); background-clip: content-box; }

        @media (max-width: 768px) {
            .hero { padding: 12px 8px 22px; }
            .hero-title { font-size: 27px; letter-spacing: 0.03em; }
            .hero-subtitle { font-size: 12px; letter-spacing: 0.06em; }
            .card-body { padding: 18px; }
            .container { margin-top: 12px; }
        }
"""


def read(path):
    with io.open(path, 'r', encoding='utf-8', newline='') as f:
        return f.read()


def write(path, content):
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(content)


def replace_once(content, old, new, label, path):
    count = content.count(old)
    if count == 0:
        if new.strip()[:40] in content:
            print('  [skip] %s 已存在' % label)
            return content
        raise RuntimeError('%s: 未找到标记 [%s]' % (path, label))
    if count > 1:
        raise RuntimeError('%s: 标记 [%s] 出现 %d 次' % (path, label, count))
    print('  [ok] %s' % label)
    return content.replace(old, new, 1)


def patch(path):
    print('处理 %s' % path)
    content = read(path)

    # 1. 标题
    content = replace_once(content, '<title>抽卡模拟器 - Web版</title>', NEW_TITLE, '页面标题', path)

    # 2. 字体引入
    bs_link = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">'
    content = replace_once(content, bs_link, bs_link + '\n    ' + FONT_LINKS, '字体链接', path)

    # 3. 替换整个 <style> 内部
    start_tag = '<style>'
    end_tag = '</style>'
    i = content.find(start_tag)
    j = content.find(end_tag)
    if i == -1 or j == -1 or j < i:
        raise RuntimeError('%s: 未找到 style 块' % path)
    if '星轨祈愿 · 设计系统' in content[i:j]:
        print('  [skip] 样式块已是新主题')
    else:
        content = content[:i + len(start_tag)] + NEW_CSS + '    ' + content[j:]
        print('  [ok] 样式块替换')

    # 4. Hero 头部
    content = replace_once(content, '<h1 class="text-center mb-4">抽卡模拟器 - Web版</h1>', HERO, 'Hero 头部', path)

    # 5. 背景装饰层
    content = replace_once(content, '<body>', '<body>\n    ' + BG_SCENE, '背景装饰层', path)

    # 6. Chart.js 全局配色
    chart_tag = '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js"></script>'
    content = replace_once(content, chart_tag, chart_tag + '\n    ' + CHART_DEFAULTS, 'Chart.js 配色', path)

    write(path, content)
    print('  完成: %s (%d 字符)' % (path, len(content)))


for f in FILES:
    patch(f)

print('全部完成')
