import io

import pandas as pd


def build_distribution_rows(draws):
    if not draws:
        return []

    counter = {}
    for draw in draws:
        counter[draw] = counter.get(draw, 0) + 1

    total = len(draws)
    return [
        {
            "抽数": draw_count,
            "出货人数": count,
            "占比": f"{count / total * 100:.1f}%",
        }
        for draw_count, count in sorted(counter.items())
    ]


def build_core_stats(stats, target_rarity):
    total_users = stats.get("total_users", 0) or 0
    second_user_count = stats.get("second_user_count", 0) or 0

    core_stats = {
        "总用户数": total_users,
        "累计总抽数": stats.get("total_draws", 0),
        "人均抽数": f"{stats.get('avg_draw_per_user', 0):.2f}",
        f"{target_rarity}总产出": stats.get("total_target_cards", 0),
        f"实际{target_rarity}单抽概率": f"{stats.get('target_single_prob', 0):.2f}%",
        "出货用户平均抽数": f"{stats.get('target_user_avg_draw', 0):.1f}",
        "出到≥1张用户占比": f"{(stats.get('users_got_first', 0) / total_users * 100) if total_users else 0:.2f}%",
    }

    if second_user_count > 0:
        core_stats["继续抽第2张用户"] = second_user_count
        core_stats["出到第2张用户"] = stats.get("users_got_second", 0)
        core_stats["第2张达成率"] = (
            f"{(stats.get('users_got_second', 0) / second_user_count * 100):.2f}%"
        )
        if stats.get("target_second_draws"):
            core_stats["第2张出货用户平均抽数"] = f"{stats.get('second_user_avg_draw', 0):.1f}"

    return core_stats


def build_excel_file(stats, target_rarity):
    output = io.BytesIO()
    core_stats = build_core_stats(stats, target_rarity)
    first_distribution = build_distribution_rows(stats.get("target_first_draws"))
    second_distribution = build_distribution_rows(stats.get("target_second_draws"))

    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pd.DataFrame(
            {"指标": list(core_stats.keys()), "数值": list(core_stats.values())}
        ).to_excel(writer, sheet_name="核心指标", index=False)

        if first_distribution:
            pd.DataFrame(first_distribution).to_excel(
                writer,
                sheet_name="首张出货分布",
                index=False,
            )

        if second_distribution:
            pd.DataFrame(second_distribution).to_excel(
                writer,
                sheet_name="第2张出货分布",
                index=False,
            )

    output.seek(0)
    return output
