from flask import Flask, render_template, request, send_file, send_from_directory
from 祈愿抽卡2 import GachaSimulator
from web_helpers import build_core_stats, build_distribution_rows, build_excel_file

app = Flask(__name__)


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

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # 获取表单参数
        user_num = int(request.form.get('user_num', 13000))
        target_rarity = request.form.get('target_rarity', 'UR')
        second_ratio = float(request.form.get('second_ratio', 0))
        budget_dist = request.form.get('budget_dist', '')
        
        try:
            stats = run_simulation(user_num, target_rarity, second_ratio, budget_dist)
        except ValueError as e:
            return render_template('index.html', error=str(e))

        return render_template(
            'index.html',
            results=build_distribution_rows(stats.get('target_first_draws')),
            core_stats=build_core_stats(stats, target_rarity),
            target_rarity=target_rarity,
        )
    
    return render_template('full.html')

@app.route('/export_excel', methods=['POST'])
def export_excel():
    # 获取表单参数
    user_num = int(request.form.get('user_num', 13000))
    target_rarity = request.form.get('target_rarity', 'UR')
    second_ratio = float(request.form.get('second_ratio', 0))
    budget_dist = request.form.get('budget_dist', '')
    
    try:
        stats = run_simulation(user_num, target_rarity, second_ratio, budget_dist)
    except ValueError as e:
        return str(e), 400

    output = build_excel_file(stats, target_rarity)
    return send_file(
        output,
        download_name='抽卡模拟结果.xlsx',
        as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )


@app.route('/battle')
@app.route('/battle/')
def battle():
    return send_from_directory('battle', 'battle.html')


@app.route('/battle/<path:filename>')
def battle_asset(filename):
    return send_from_directory('battle', filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
