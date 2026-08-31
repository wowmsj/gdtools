import re

with open('templates/full.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 隐藏真实用户行为模拟标签：去掉 active，加 style="display:none;"
content = re.sub(
    r'<button class="nav-link active" id="real-user-tab"',
    '<button class="nav-link" id="real-user-tab" style="display:none;"',
    content
)

# 2. 隐藏收集模拟标签
content = re.sub(
    r'<button class="nav-link" id="collection-tab"',
    '<button class="nav-link" id="collection-tab" style="display:none;"',
    content
)

# 3. 计算规则说明设为默认 active
content = re.sub(
    r'<button class="nav-link" id="rules-tab"',
    '<button class="nav-link active" id="rules-tab"',
    content
)

# 4. real-user 的 tab-pane 去掉 active
content = re.sub(
    r'<div class="tab-pane fade show active" id="real-user"',
    '<div class="tab-pane fade" id="real-user"',
    content
)

# 5. rules 的 tab-pane 设为 active
content = re.sub(
    r'<div class="tab-pane fade" id="rules"',
    '<div class="tab-pane fade show active" id="rules"',
    content
)

with open('templates/full.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
