import random
from collections import defaultdict

class GachaSimulator:
    def __init__(self):
        # ========== 适配真实数据的抽卡概率配置 ==========
        self.config = {
            # 稀有度概率配置 - 支持起始抽数和截至抽数
            # 格式: [起始抽数, 截至抽数, UR概率, SSR概率, SR概率, ...]
            "rarity_prob": [
                [39, 40, 1, 0, 0],    # 1-38抽: UR=0.01%, SSR=10%, SR=89.99%
                # [39, 40, 0.03, 0.1, 0.87],        # 39-40抽: UR=3%, SSR=10%, SR=87%
                # [44, 44, 0.08, 0.1, 0.82],        # 44抽: UR=8%, SSR=10%, SR=82%
                # [45, 45, 1.0, 0, 0],              # 45抽: UR=100%
                # [60, 60, 1.0, 0, 0],              # 60抽: UR=100%
            ],
            "rarity_prob_type": "linear",  # fixed 或 linear
            # 基础概率 - 当没有阶梯概率覆盖时使用
            "base_rarity_prob": {
                "UR": 0.01,   # 0.01%
                "SSR": 0.09,     # 10%
                "SR": 0.9    # 89.99%
            },
            # 稀有度排序 - 用于小保底概率计算
            "rarity_order": ["UR", "SSR", "SR"],
            "rarity_inner_prob": {
                "UR": {"UR_A": 1},
                "SSR": {"SSR_A": 1},
                "SR": {"SR_A": 1},
            },
            "card_prob": {
                "UR_A": {"UR_最高等级卡": 1},
                "SSR_A": {f"SSR卡{i}": 1/8 for i in range(1,9)},
                "SR_A": {f"SR卡{i}": 1/20 for i in range(1,21)},
            },
            "price_per_draw": 0.8,
            "small_pity_threshold": 10,
            "small_pity_rarity": ["UR", "SSR"],  # 小保底可提升到多个稀有度
            "pity_threshold": 40,
            "pity_rarity_prob": {"UR": 1}
        }

        self.reset()
        self.multiple_collection_results = []
        self.last_collection_type = None
        self.last_target_rarity = None
        self.only_limited = False
        self.multiple_card_details = defaultdict(list)
        self._check_prob_sum()

        self.user_draw_records = []
        self.last_user_target = None
        self.fixed_draw_records = []
        self.last_fixed_target = None
        self.total_fixed_draws = 0
        self.avg_target_records = []
        self.avg_target_stat = {}

        self.real_user_records = []
        self.real_user_stat = {}

    def reset(self, pity_reset=True):
        self.detailed_results = defaultdict(int)
        self.rarity_results = defaultdict(int)
        self.total_draws = 0
        self.ur_pity_positions = []
        self.ur_total_positions = []
        self.ur_intervals = []
        if pity_reset:
            self.pity_triggered = 0
            self.small_pity_triggered = 0
            self.luck_count = 0
        self.total_small_pity_count = 0
        self.collected_cards = set()
        self.current_draws = 0

    def _check_prob_sum(self):
        rarity_order = self.config.get("rarity_order", ["UR", "SSR", "SR"])
        for idx, interval in enumerate(self.config["rarity_prob"]):
            start_draw, end_draw, *prob_list = interval
            total = round(sum(prob_list), 3)
            if abs(total - 1.0) > 0.001:
                print(f"⚠️  配置警告：第{idx + 1}个概率区间[抽数{start_draw}-{end_draw}]的概率总和={total}，正确应为1.0")
        for group, cards in self.config["card_prob"].items():
            total = round(sum(cards.values()), 3)
            if abs(total - 1.0) > 0.001:
                print(f"⚠️  配置警告：卡牌组[{group}]的概率总和={total}，正确应为1.0")

    def _get_current_prob(self):
        """获取当前抽数的概率配置"""
        intervals = self.config.get("rarity_prob", [])
        base_rarity_prob = self.config.get("base_rarity_prob", {})
        rarity_prob_type = self.config.get("rarity_prob_type", "fixed")
        rarity_order = self.config.get("rarity_order", ["UR", "SSR", "SR"])
        
        # 首先检查当前抽数是否在任何阶梯概率的区间内
        for i, interval in enumerate(intervals):
            start_draw, end_draw, *prob_list = interval
            
            if self.current_draws >= start_draw and self.current_draws <= end_draw:
                if rarity_prob_type == "fixed":
                    # 固定值模式
                    return {rarity: prob for rarity, prob in zip(rarity_order, prob_list)}
                else:
                    # 线性递增模式 - 当前区间的起始概率继承上一个区间的结束概率或基础概率
                    # 修正：第一个区间使用基础概率作为起始概率
                    draw_range = end_draw - start_draw + 1
                    draw_position = self.current_draws - start_draw + 1
                    
                    prob_obj = {}
                    for j, rarity in enumerate(rarity_order):
                        total_value = prob_list[j] if j < len(prob_list) else 0
                        
                        # 获取上一个区间的结束概率
                        previous_end_prob = 0
                        if i > 0:
                            # 不是第一个区间，取上一个区间的目标概率（最后一抽的概率）
                            prev_interval = intervals[i - 1]
                            previous_end_prob = prev_interval[j + 2] if j + 2 < len(prev_interval) else 0
                        else:
                            # 第一个区间，使用基础概率作为起始概率
                            # 即使区间从第1抽开始，也应该使用基础概率作为起始
                            previous_end_prob = base_rarity_prob.get(rarity, 0)
                        
                        # 当前区间的增量 = (目标概率 - 上一个区间结束概率) / 区间长度
                        # 例如：基础概率0.01%，区间4-10抽目标概率5%
                        # 增量 = (5% - 0.01%) / 7，第4抽 = 0.01% + 增量 * 1
                        increment = (total_value - previous_end_prob) / draw_range
                        # 当前抽数的概率 = 上一个区间结束概率 + 增量 * 当前位置
                        interpolated_value = previous_end_prob + increment * draw_position
                        prob_obj[rarity] = interpolated_value
                    
                    return prob_obj
        
        # 如果不在任何阶梯概率区间内，使用基础概率
        if base_rarity_prob:
            return base_rarity_prob.copy()
        
        # 默认概率，只在最后一个稀有度类型上设置1.0
        default_prob = {}
        for i, rarity in enumerate(rarity_order):
            default_prob[rarity] = 1.0 if i == len(rarity_order) - 1 else 0
        return default_prob

    def _choose_inner_rarity(self, rarity):
        """选择内部稀有度"""
        inner_prob = self.config["rarity_inner_prob"].get(rarity)
        if not inner_prob:
            return rarity + "_A"
        
        rand = random.random()
        cumulative = 0
        for card_type, prob in inner_prob.items():
            cumulative += prob
            if rand < cumulative:
                return card_type
        return list(inner_prob.keys())[0]

    def _choose_specific_card(self, rarity):
        """选择具体卡牌"""
        # 确保 rarity 不为 None
        safe_rarity = rarity if rarity else "UR"
        inner_rarity = self._choose_inner_rarity(safe_rarity)
        card_dict = self.config["card_prob"].get(inner_rarity, {})
        if not card_dict:
            return f"{safe_rarity}_DEFAULT"
        
        rand = random.random()
        cumulative = 0
        for card, prob in card_dict.items():
            cumulative += prob
            if rand < cumulative:
                return card
        return list(card_dict.keys())[0]

    def _get_card(self, draw_count):
        """获取卡牌，包含大保底和小保底逻辑"""
        # 大保底逻辑
        pity_threshold = self.config.get("pity_threshold", 0)
        if pity_threshold > 0 and draw_count > 0 and draw_count % pity_threshold == 0:
            self.pity_triggered += 1
            rand = random.random()
            cumulative = 0
            for rarity, prob in self.config["pity_rarity_prob"].items():
                cumulative += prob
                if rand < cumulative:
                    card = self._choose_specific_card(rarity)
                    return card, rarity, False, None  # (card, rarity, is_small_pity, small_pity_prob)
            # 如果没有找到，使用第一个稀有度
            default_rarity = list(self.config["pity_rarity_prob"].keys())[0] if self.config["pity_rarity_prob"] else "UR"
            card = self._choose_specific_card(default_rarity)
            return card, default_rarity, False, None
        
        # 正常抽卡逻辑
        current_prob = self._get_current_prob()
        rand = random.random()
        cumulative = 0
        
        # 检查是否触发小保底
        small_pity_threshold = self.config.get("small_pity_threshold", 0)
        is_small_pity = (small_pity_threshold > 0 and 
                        draw_count > 0 and 
                        draw_count % small_pity_threshold == 0)
        small_pity_triggered = False
        small_pity_prob = None
        
        rarity_order = self.config.get("rarity_order", ["UR", "SSR", "SR"])
        
        for rarity in rarity_order:
            cumulative += current_prob.get(rarity, 0)
            if rand < cumulative:
                if is_small_pity:
                    # 检查是否触发小保底
                    small_pity_rarities = self.config.get("small_pity_rarity", [])
                    if small_pity_rarities and rarity in small_pity_rarities:
                        # 计算小保底稀有度的概率分布
                        small_pity_prob = {}
                        
                        # 如果只有一个小保底稀有度，直接返回
                        if len(small_pity_rarities) == 1:
                            self.small_pity_triggered += 1
                            small_pity_triggered = True
                            if small_pity_rarities[0] == "UR":
                                self.luck_count += 1
                            card = self._choose_specific_card(small_pity_rarities[0])
                            return card, small_pity_rarities[0], small_pity_triggered, small_pity_prob
                        
                        # 按照稀有度排序
                        sorted_small_pity_rarities = sorted(small_pity_rarities, 
                                                           key=lambda x: rarity_order.index(x) if x in rarity_order else 999)
                        
                        # 计算每个小保底稀有度的概率
                        # UR的概率等于当前抽数的UR卡阶梯概率
                        # 其他稀有度的概率等于100%减去UR的概率
                        ur_prob = current_prob.get("UR", 0)
                        remaining_prob = 1.0 - ur_prob
                        
                        for sp_rarity in sorted_small_pity_rarities:
                            if sp_rarity == "UR":
                                small_pity_prob[sp_rarity] = ur_prob
                            else:
                                small_pity_prob[sp_rarity] = remaining_prob / (len(sorted_small_pity_rarities) - 1)
                        
                        # 随机选择小保底稀有度
                        sp_rand = random.random()
                        sp_cumulative = 0
                        for sp_rarity in sorted_small_pity_rarities:
                            sp_cumulative += small_pity_prob[sp_rarity]
                            if sp_rand < sp_cumulative:
                                self.small_pity_triggered += 1
                                small_pity_triggered = True
                                if sp_rarity == "UR":
                                    self.luck_count += 1
                                card = self._choose_specific_card(sp_rarity)
                                return card, sp_rarity, small_pity_triggered, small_pity_prob
                
                if rarity == "UR":
                    self.luck_count += 1
                card = self._choose_specific_card(rarity)
                return card, rarity, small_pity_triggered, small_pity_prob
        
        # 默认返回最后一个稀有度
        default_rarity = rarity_order[-1] if rarity_order else "SR"
        card = self._choose_specific_card(default_rarity)
        return card, default_rarity, small_pity_triggered, small_pity_prob

    def single_draw(self, silent=False):
        """单次抽卡"""
        self.total_draws += 1
        self.current_draws += 1
        card, rarity, small_pity_triggered, small_pity_prob = self._get_card(self.current_draws)
        self.detailed_results[card] += 1
        self.collected_cards.add(card)
        self.rarity_results[rarity] += 1

        if rarity == "UR":
            self.ur_pity_positions.append(self.current_draws)
            self.ur_total_positions.append(self.total_draws)
            if len(self.ur_total_positions) >= 2:
                interval = self.ur_total_positions[-1] - self.ur_total_positions[-2]
                self.ur_intervals.append(interval)

        pity_target_rarities = self.config["pity_rarity_prob"].keys()
        if rarity in pity_target_rarities:
            self.current_draws = 0
        
        # 返回包含小保底信息的完整结果
        current_prob = self._get_current_prob()
        return {
            "card": card,
            "rarity": rarity,
            "prob": current_prob,
            "current_draw": self.current_draws,
            "small_pity_triggered": small_pity_triggered,
            "small_pity_prob": small_pity_prob
        }

    def multi_draw(self, num, silent=False):
        """多次抽卡"""
        results = []
        for _ in range(num):
            result = self.single_draw(silent=silent)
            results.append(result)
        return results

    # ========== 保留原有方法 ==========
    def _get_target_cards(self, target_rarity=None):
        if target_rarity is None:
            all_cards = []
            for rarity in self.config["card_prob"]:
                all_cards.extend(self.config["card_prob"][rarity].keys())
            return all_cards
        else:
            if not isinstance(target_rarity, list):
                target_rarity = [target_rarity]
            all_targets = []
            for rarity in target_rarity:
                inner_rarity = rarity + "_A"
                if inner_rarity in self.config["card_prob"]:
                    all_targets.extend(self.config["card_prob"][inner_rarity].keys())
            return all_targets

    def _parse_budget_distribution(self, budget_dist):
        """Parse budget strings like '3:0.334,60:0.666' into normalized weights."""
        if isinstance(budget_dist, (list, tuple)):
            return [[int(draws), float(ratio)] for draws, ratio in budget_dist]

        if not isinstance(budget_dist, str):
            raise ValueError("用户预算分布必须是字符串，例如：3:0.334,60:0.666")

        merged_distribution = defaultdict(float)
        for raw_item in budget_dist.split(","):
            item = raw_item.strip()
            if not item:
                continue

            if ":" not in item:
                raise ValueError(f"预算分布格式错误：{item}")

            draw_text, ratio_text = [part.strip() for part in item.split(":", 1)]
            try:
                draw_count = int(draw_text)
                ratio = float(ratio_text)
            except ValueError as exc:
                raise ValueError(f"预算分布格式错误：{item}") from exc

            if draw_count <= 0:
                raise ValueError("预算中的抽数必须大于 0")
            if ratio < 0:
                raise ValueError("预算中的占比不能小于 0")

            merged_distribution[draw_count] += ratio

        if not merged_distribution:
            raise ValueError("用户预算分布不能为空")

        total_ratio = sum(merged_distribution.values())
        if total_ratio <= 0:
            raise ValueError("用户预算分布占比之和必须大于 0")

        return [
            [draw_count, ratio / total_ratio]
            for draw_count, ratio in sorted(merged_distribution.items())
        ]

    def _build_user_budgets(self, total_users, budget_distribution):
        if not budget_distribution:
            raise ValueError("用户预算分布不能为空")

        exact = [[draws, total_users * ratio] for draws, ratio in budget_distribution]
        counts = {}
        for draws, expected_count in exact:
            counts[draws] = int(expected_count)

        used = sum(counts.values())
        remainder = total_users - used

        sorted_by_fraction = sorted(
            [[draws, expected_count - int(expected_count)] for draws, expected_count in exact],
            key=lambda item: item[1],
            reverse=True,
        )
        for index in range(remainder):
            draws = sorted_by_fraction[index % len(sorted_by_fraction)][0]
            counts[draws] = counts.get(draws, 0) + 1

        user_budgets = []
        for budget, count in counts.items():
            user_budgets.extend([budget] * count)

        random.shuffle(user_budgets)
        return user_budgets

    def simulate_full_collection(self, target_cards, max_draws=10000):
        """模拟收集所有目标卡牌"""
        self.reset()
        collected = set()
        draw_history = []
        
        while len(collected) < len(target_cards) and self.total_draws < max_draws:
            result = self.single_draw(silent=True)
            card = result["card"]
            draw_history.append(card)
            
            if card in target_cards:
                collected.add(card)
        
        return {
            "total_draws": self.total_draws,
            "collected": list(collected),
            "draw_history": draw_history
        }

    def simulate_real_user_behavior(self, total_users, target_rarity, target_count=1, budget_distribution=None, second_ratio=0):
        """模拟真实用户行为"""
        if budget_distribution is None:
            budget_distribution = [[3, 0.334], [60, 0.666]]

        second_ratio = max(0.0, min(float(second_ratio), 100.0))
        second_ratio_prob = second_ratio / 100.0
        base_target_count = max(1, int(target_count))
        user_budgets = self._build_user_budgets(total_users, budget_distribution)

        total_draws = 0
        total_target_cards = 0
        users_got_first = 0
        users_got_second = 0
        second_user_count = 0
        first_draws = []
        second_draws = []
        user_records = []
        all_draw_details = []

        for i in range(total_users):
            self.reset()
            user_max_draw = user_budgets[i]
            draw_count = 0
            target_card_count = 0
            first_pos = None
            second_pos = None
            continue_for_second = False
            desired_target_count = base_target_count
            user_draw_details = []

            while draw_count < user_max_draw:
                draw_count += 1
                result = self.single_draw(silent=True)
                card = result["card"]
                rarity = result["rarity"]
                prob = result["prob"]
                current_draw = result["current_draw"]
                small_pity_triggered = result["small_pity_triggered"]
                small_pity_prob = result["small_pity_prob"]
                
                user_draw_details.append({
                    "user_index": i + 1,
                    "total_draw_num": total_draws + draw_count,
                    "current_draw": current_draw,
                    "card": card,
                    "rarity": rarity,
                    "prob": prob,
                    "small_pity_triggered": small_pity_triggered,
                    "small_pity_prob": small_pity_prob
                })

                if rarity == target_rarity:
                    target_card_count += 1

                    if target_card_count == 1:
                        first_pos = draw_count
                        users_got_first += 1
                        first_draws.append(first_pos)

                        if base_target_count == 1 and second_ratio_prob > 0:
                            continue_for_second = random.random() < second_ratio_prob
                            if continue_for_second:
                                second_user_count += 1
                                desired_target_count = 2

                    if continue_for_second and target_card_count == 2:
                        second_pos = draw_count
                        users_got_second += 1
                        second_draws.append(second_pos)

                    if target_card_count >= desired_target_count:
                        break

            all_draw_details.extend(user_draw_details)

            user_records.append({
                "draws": draw_count,
                "got_first": target_card_count >= 1,
                "first_pos": first_pos,
                "got_second": target_card_count >= 2,
                "second_pos": second_pos,
                "continued_to_second": continue_for_second,
                "budget": user_max_draw
            })

            total_draws += draw_count
            total_target_cards += target_card_count

        # 计算统计数据
        avg_draw_per_user = total_draws / total_users if total_users > 0 else 0
        target_single_prob = total_target_cards / total_draws * 100 if total_draws > 0 else 0
        target_user_avg_draw = sum(first_draws) / len(first_draws) if first_draws else 0
        second_user_avg_draw = sum(second_draws) / len(second_draws) if second_draws else 0

        self.real_user_records = user_records
        self.real_user_stat = {
            "total_users": total_users,
            "total_draws": total_draws,
            "avg_draw_per_user": avg_draw_per_user,
            "total_target_cards": total_target_cards,
            "users_got_first": users_got_first,
            "users_got_second": users_got_second,
            "second_user_count": second_user_count,
            "target_single_prob": target_single_prob,
            "target_user_avg_draw": target_user_avg_draw,
            "second_user_avg_draw": second_user_avg_draw,
            "target_first_draws": first_draws,
            "target_second_draws": second_draws,
            "all_draw_details": all_draw_details,
            "user_records": user_records
        }

        return self.real_user_stat


# ========== 主程序入口 ==========
if __name__ == "__main__":
    sim = GachaSimulator()
    
    # 测试单次抽卡
    print("=== 单次抽卡测试 ===")
    for i in range(10):
        result = sim.single_draw()
        print(f"第{i+1}抽: {result['card']} ({result['rarity']}), 小保底: {result['small_pity_triggered']}")
    
    # 测试多次抽卡
    print("\n=== 多次抽卡测试 ===")
    sim.reset()
    results = sim.multi_draw(100)
    print(f"100抽结果: UR={sim.rarity_results['UR']}, SSR={sim.rarity_results['SSR']}, SR={sim.rarity_results['SR']}")
    
    # 测试真实用户模拟
    print("\n=== 真实用户模拟测试 ===")
    sim.reset()
    stats = sim.simulate_real_user_behavior(1000, "UR", target_count=1)
    print(f"总用户数: {stats['total_users']}")
    print(f"总抽数: {stats['total_draws']}")
    print(f"人均抽数: {stats['avg_draw_per_user']:.2f}")
    print(f"出货用户数: {stats['users_got_first']}")
    print(f"出货用户平均抽数: {stats['target_user_avg_draw']:.2f}")
