import streamlit as st
import pandas as pd
from 祈愿抽卡2 import GachaSimulator
from web_helpers import build_core_stats, build_distribution_rows, build_excel_file

# 设置页面标题
st.set_page_config(page_title="抽卡模拟器 - Web版", layout="wide")

# 页面标题
st.title("抽卡模拟器 - Web版")


def run_simulation(user_num, target_rarity, second_ratio, budget_dist):
    gacha = GachaSimulator()
    budget_distribution = gacha._parse_budget_distribution(budget_dist) if budget_dist.strip() else None
    gacha.simulate_real_user_behavior(
        total_users=user_num,
        target_rarity=target_rarity,
        budget_distribution=budget_distribution,
        second_ratio=second_ratio,
    )
    return gacha.real_user_stat

# 表单参数
with st.form("gacha_form"):
    col1, col2 = st.columns(2)
    
    with col1:
        user_num = st.number_input("总模拟用户数", min_value=1, value=13000)
        target_rarity = st.selectbox("目标稀有度", ["UR", "SSR", "SR"])
    
    with col2:
        second_ratio = st.number_input("继续抽第2张的用户占比", min_value=0.0, max_value=100.0, value=0.0)
        budget_dist = st.text_input("用户预算分布", placeholder="例如：3:0.334,60:0.666")
    
    submit_button = st.form_submit_button("运行模拟")

if submit_button:
    try:
        with st.spinner("正在运行模拟..."):
            stats = run_simulation(user_num, target_rarity, second_ratio, budget_dist)
    except ValueError as e:
        st.error(f"错误：{str(e)}")
        st.stop()

    results = build_distribution_rows(stats.get('target_first_draws'))
    core_stats = build_core_stats(stats, target_rarity)
    
    # 显示结果
    st.subheader(f"{target_rarity} 抽卡模拟结果")
    
    # 核心指标
    st.write("### 核心指标")
    col1, col2 = st.columns(2)
    for i, (key, value) in enumerate(core_stats.items()):
        if i % 2 == 0:
            col1.write(f"**{key}:** {value}")
        else:
            col2.write(f"**{key}:** {value}")
    
    # 出货分布
    st.write("### 出货用户抽数分布")
    if results:
        df = pd.DataFrame(results)
        st.dataframe(df)
    else:
        st.write("暂无出货数据")
    
    # 导出Excel
    st.write("### 导出结果")
    output = build_excel_file(stats, target_rarity)
    
    st.download_button(
        label="导出Excel",
        data=output,
        file_name="抽卡模拟结果.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
