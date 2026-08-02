import re
from collections import defaultdict

from app.models.cv_analysis import CVAnalysis


SKILLS = {
    "python",
    "fastapi",
    "flask",
    "django",
    "sql",
    "postgresql",
    "mysql",
    "sqlite",
    "docker",
    "git",
    "github",
    "linux",
    "javascript",
    "typescript",
    "react",
    "java",
    "c++",
    "machine learning",
    "deep learning",
    "pytorch",
    "tensorflow",
    "nlp",
    "rest api",
    "html",
    "css",
    "bootstrap",
    "aws",
    "azure",
    "kubernetes",
    "redis",
    "mongodb",
    # iOS ve mobil geliştirme
    "swift",
    "objective-c",
    "swiftui",
    "uikit",
    "xcode",
    "core data",
    "firebase",
    "cocoapods",
    "xctest",
    "mvvm",
}


def extract_skills(text: str) -> list[str]:
    lowered = text.casefold()

    return sorted(
        skill
        for skill in SKILLS
        if re.search(
            rf"(?<!\w){re.escape(skill)}(?!\w)",
            lowered,
        )
    )


def analyze_cv_text(text: str) -> dict:
    cleaned = " ".join(text.split())
    skills = extract_skills(cleaned)
    lowered = cleaned.casefold()

    has_education = any(
        word in lowered
        for word in (
            "üniversite",
            "university",
            "eğitim",
            "education",
        )
    )

    has_experience = any(
        word in lowered
        for word in (
            "deneyim",
            "experience",
            "staj",
            "intern",
        )
    )

    has_contact = bool(
        re.search(
            r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}",
            cleaned,
        )
    )

    score = min(
        100,
        25
        + min(len(skills) * 6, 42)
        + 12 * has_education
        + 12 * has_experience
        + 9 * has_contact,
    )

    strengths = []
    weaknesses = []

    if skills:
        strengths.append(
            f"CV'de {len(skills)} doğrulanabilir "
            "teknik beceri bulunuyor."
        )
    else:
        weaknesses.append(
            "Teknik beceriler açık ve anahtar "
            "kelime odaklı yazılmamış."
        )

    for present, strength, weakness in (
        (
            has_education,
            "Eğitim bilgisi bulunuyor.",
            "Eğitim bölümü eksik veya yeterince açık değil.",
        ),
        (
            has_experience,
            "Deneyim/proje bilgisi bulunuyor.",
            "Deneyimler ölçülebilir sonuçlarla belirtilmeli.",
        ),
        (
            has_contact,
            "İletişim e-postası bulunuyor.",
            "Geçerli bir iletişim e-postası eklenmeli.",
        ),
    ):
        if present:
            strengths.append(strength)
        else:
            weaknesses.append(weakness)

    recommendations = [
        item
        for item in (
            (
                "Teknik becerileri ayrı bir bölümde listeleyin."
                if not skills
                else None
            ),
            (
                "Projelerde kullanılan teknolojileri ve "
                "ölçülebilir sonuçları belirtin."
            ),
            (
                "İş ilanındaki anahtar kelimelere göre "
                "CV'nizi uyarlayın."
            ),
        )
        if item
    ]

    if len(skills) >= 10 and has_experience:
        experience_level = "advanced"
    elif len(skills) >= 5:
        experience_level = "intermediate"
    else:
        experience_level = "beginner"

    return {
        "overall_score": score,
        "summary": (
            f"CV {score}/100 puan aldı ve "
            f"{len(skills)} teknik beceri tespit edildi."
        ),
        "skills": skills,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "experience_level": experience_level,
        "analysis_data": {
            "characterCount": len(cleaned),
            "hasEducation": has_education,
            "hasExperience": has_experience,
            "hasContact": has_contact,
        },
    }


def score_quiz(
    answers: list[dict],
) -> tuple[int, dict[str, int], str]:
    category_values: dict[str, list[int]] = defaultdict(list)

    for answer in answers:
        category_values[answer["category"]].append(
            answer["value"]
        )

    category_scores = {
        key: round(
            sum(values) / (len(values) * 5) * 100
        )
        for key, values in category_values.items()
    }

    score = round(
        sum(answer["value"] for answer in answers)
        / (len(answers) * 5)
        * 100
    )

    if score >= 80:
        level = "advanced"
    elif score >= 50:
        level = "intermediate"
    else:
        level = "beginner"

    return score, category_scores, level


def match_job(
    analysis: CVAnalysis,
    description: str,
) -> dict:
    required = set(extract_skills(description))
    owned = set(analysis.skills or [])

    matched = sorted(owned.intersection(required))
    missing = sorted(required.difference(owned))

    if required:
        score = round(
            len(matched) / len(required) * 100
        )
    else:
        score = 0

    if score >= 75:
        recommendation = (
            "Bu pozisyon için güçlü bir eşleşme."
        )
    elif score >= 40:
        recommendation = (
            "Eksik becerileri geliştirerek "
            "eşleşme artırılabilir."
        )
    else:
        recommendation = (
            "Pozisyona başvurmadan önce "
            "temel eksikler tamamlanmalı."
        )

    return {
        "match_score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "recommendation": recommendation,
    }