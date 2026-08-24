# 抽卡模拟器 - Web版

## 项目介绍

这是一个基于PyScript的抽卡模拟器Web应用，将原本的Python命令行抽卡模拟器封装为可视化的Web界面，方便用户调整参数、查看结果并导出Excel。

## 功能特点

- **Web界面操作**：通过浏览器访问，无需安装Python环境
- **参数调整**：可调整总模拟用户数、目标稀有度、继续抽第2张的用户占比和用户预算分布
- **结果展示**：实时显示核心指标和出货用户抽数分布
- **Excel导出**：将模拟结果导出为Excel文件，包含核心指标和出货分布两个工作表

## 如何使用

### 方法1：直接打开HTML文件

1. 双击打开 `gacha_web.html` 文件
2. 在浏览器中调整参数
3. 点击"运行模拟"按钮
4. 查看模拟结果
5. 点击"导出Excel"按钮下载结果

### 方法2：使用Flask应用（需要Python环境）

1. 安装依赖：`pip install -r requirements.txt`
2. 运行应用：`python app.py`
3. 在浏览器中访问 `http://localhost:5000`
4. 调整参数并运行模拟
5. 导出Excel结果

## 技术实现

- **前端**：HTML5 + Bootstrap + JavaScript
- **后端**：PyScript（在浏览器中运行Python代码）
- **数据处理**：Python + pandas
- **Excel导出**：xlsx.js

## 注意事项

- 使用PyScript版本时，首次加载可能会较慢，因为需要下载Python运行环境
- 模拟大量用户时，可能会占用较多浏览器资源，请耐心等待
- 若遇到性能问题，建议减少模拟用户数

## 文件说明

- `祈愿抽卡2.py`：原始的Python抽卡模拟器代码
- `gacha_web.html`：基于PyScript的Web版抽卡模拟器
- `app.py`：基于Flask的Web应用（需要Python环境）
- `requirements.txt`：Flask应用的依赖包
- `templates/index.html`：Flask应用的HTML模板

## 示例参数

- **总模拟用户数**：13000
- **目标稀有度**：UR、SSR、SR
- **继续抽第2张的用户占比**：0-100（例如：10表示10%）
- **用户预算分布**：格式为"抽数:占比，逗号分隔"，例如："3:0.334,60:0.666"
