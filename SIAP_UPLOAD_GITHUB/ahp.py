"""
Modul Algoritma Analytical Hierarchy Process (AHP)
Sistem Pendukung Keputusan Pemilihan Mobil

Modul ini mengimplementasikan perhitungan matematis AHP secara lengkap:
1. Pembentukan & validasi matriks perbandingan berpasangan
2. Penjumlahan kolom matriks
3. Normalisasi matriks perbandingan
4. Perhitungan bobot prioritas (Priority Vector / Eigen Vector)
5. Perhitungan Weighted Sum Vector & Nilai Lambda Maksimum (λ max)
6. Perhitungan Consistency Index (CI)
7. Penentuan Random Index (RI) standar Saaty
8. Perhitungan Consistency Ratio (CR)
9. Pengujian konsistensi logis (CR <= 0.10)
10. Sintesis nilai akhir dan perankingan alternatif
"""

import numpy as np

# Tabel Random Index (RI) standar Thomas L. Saaty untuk n = 1 sampai 15
SAATY_RI_TABLE = {
    1: 0.00,
    2: 0.00,
    3: 0.58,
    4: 0.90,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49,
    11: 1.51,
    12: 1.54,
    13: 1.56,
    14: 1.57,
    15: 1.59
}


def get_random_index(n: int) -> float:
    """Mengembalikan nilai Random Index (RI) berdasarkan ukuran matriks n."""
    return SAATY_RI_TABLE.get(n, 1.59)


def calculate_ahp_matrix(matrix: list or np.ndarray, labels: list = None, title: str = "") -> dict:
    """
    Menghitung seluruh tahapan AHP untuk sebuah matriks perbandingan berpasangan.
    
    Tahapan:
    1. Validasi dimensi bujur sangkar (n x n)
    2. Menghitung jumlah per kolom (col_sums)
    3. Normalisasi matriks: elemen / jumlah kolom masing-masing
    4. Menghitung bobot prioritas: rata-rata per baris dari matriks ternormalisasi
    5. Menghitung eigen value / weighted sum vector per kriteria (total_kolom * bobot)
    6. Menghitung Lambda Max (jumlah dari total_kolom * bobot)
    7. Menghitung Consistency Index (CI) = (Lambda_max - n) / (n - 1)
    8. Menentukan Random Index (RI)
    9. Menghitung Consistency Ratio (CR) = CI / RI
    10. Evaluasi status konsistensi (CR <= 0.10)
    """
    mat = np.array(matrix, dtype=float)
    n, cols = mat.shape
    if n != cols:
        raise ValueError(f"Matriks harus berukuran bujur sangkar (n x n). Dimensi saat ini: {n}x{cols}")
    
    if labels is None:
        labels = [f"Item {i+1}" for i in range(n)]
    elif len(labels) != n:
        raise ValueError(f"Jumlah label ({len(labels)}) tidak sesuai ukuran matriks ({n})")

    # 1. Jumlah setiap kolom
    col_sums = mat.sum(axis=0)

    # 2. Normalisasi matriks (setiap elemen dibagi total kolomnya)
    # Menghindari pembagian dengan nol
    safe_col_sums = np.where(col_sums == 0, 1e-9, col_sums)
    normalized_matrix = mat / safe_col_sums

    # 3. Vektor jumlah baris dan Bobot Prioritas (Priority Vector)
    row_sums = normalized_matrix.sum(axis=1)
    weights = normalized_matrix.mean(axis=1)  # row_sums / n

    # 4. Lambda Max (λ_max)
    # Sesuai formula pada studi kasus Excel: SUM(Total Kolom * Bobot Baris)
    eigen_contributions = col_sums * weights
    lambda_max = float(np.sum(eigen_contributions))

    # 5. Consistency Index (CI)
    if n > 1:
        ci = float((lambda_max - n) / (n - 1))
    else:
        ci = 0.0

    # 6. Random Index (RI)
    ri = get_random_index(n)

    # 7. Consistency Ratio (CR)
    if ri > 0:
        cr = float(ci / ri)
    else:
        cr = 0.0

    # 8. Status Konsistensi (ambang batas Saaty CR <= 0.10)
    # Diberikan toleransi floating point kecil (misal 0.10001)
    is_consistent = cr <= 0.10005
    status = "Konsisten" if is_consistent else "Tidak Konsisten"

    return {
        "title": title,
        "size": n,
        "labels": labels,
        "raw_matrix": mat.tolist(),
        "col_sums": col_sums.tolist(),
        "normalized_matrix": normalized_matrix.tolist(),
        "row_sums": row_sums.tolist(),
        "weights": weights.tolist(),
        "weights_percent": [float(w * 100) for w in weights],
        "eigen_contributions": eigen_contributions.tolist(),
        "lambda_max": lambda_max,
        "ci": ci,
        "ri": ri,
        "cr": cr,
        "cr_percent": float(cr * 100),
        "is_consistent": is_consistent,
        "status": status,
        "threshold": 0.10
    }


def synthesize_ahp(criteria_res: dict, alt_res_dict: dict, alt_labels: list, criteria_labels: list, criteria_keys: list) -> dict:
    """
    Melakukan sintesis akhir perhitungan AHP:
    Mengalikan bobot setiap alternatif pada setiap kriteria dengan bobot kriteria terkait,
    kemudian menjumlahkan untuk mendapatkan skor global akhir dan menentukan ranking.
    """
    n_alts = len(alt_labels)
    n_crits = len(criteria_labels)
    
    crit_weights = np.array(criteria_res["weights"], dtype=float)

    # Membentuk matriks skor alternatif: dimensi (n_alts x n_crits)
    # Kolom j adalah bobot alternatif pada kriteria j
    alt_weight_columns = []
    for c_key in criteria_keys:
        if c_key not in alt_res_dict:
            raise KeyError(f"Data perhitungan alternatif untuk kriteria '{c_key}' tidak ditemukan.")
        alt_w = alt_res_dict[c_key]["weights"]
        alt_weight_columns.append(alt_w)

    # Matriks bobot alternatif (n_alts x n_crits)
    alt_matrix = np.column_stack(alt_weight_columns)

    # Matriks kontribusi terbobot (tiap elemen dikalikan bobot kriterianya)
    # Sesuai Baris 90-93 pada Excel: Skor_ij = AltWeight_ij * CritWeight_j
    weighted_matrix = alt_matrix * crit_weights

    # Nilai akhir (total skor tiap mobil)
    final_scores = weighted_matrix.sum(axis=1)

    # Menentukan peringkat (Ranking: skor tertinggi peringkat 1)
    # Menggunakan argsort berurut dari nilai terbesar ke terkecil
    sorted_indices = np.argsort(-final_scores)
    ranks = np.empty_like(sorted_indices)
    ranks[sorted_indices] = np.arange(1, n_alts + 1)

    # Menyusun struktur hasil per alternatif
    alternatives_summary = []
    for i in range(n_alts):
        car_name = alt_labels[i]
        score = float(final_scores[i])
        rank = int(ranks[i])
        
        # Detail kontribusi per kriteria
        breakdown = {}
        raw_weights_per_crit = {}
        for j, c_name in enumerate(criteria_labels):
            breakdown[c_name] = {
                "local_weight": float(alt_matrix[i, j]),
                "criteria_weight": float(crit_weights[j]),
                "weighted_score": float(weighted_matrix[i, j]),
                "contribution_percent": float((weighted_matrix[i, j] / score * 100) if score > 0 else 0)
            }
            raw_weights_per_crit[c_name] = float(alt_matrix[i, j])

        alternatives_summary.append({
            "name": car_name,
            "final_score": score,
            "final_score_percent": float(score * 100),
            "rank": rank,
            "breakdown": breakdown,
            "raw_weights": raw_weights_per_crit
        })

    # Urutkan berdasarkan ranking untuk tampilan
    ranked_alternatives = sorted(alternatives_summary, key=lambda x: x["rank"])
    best_alternative = ranked_alternatives[0] if ranked_alternatives else None

    # Ringkasan uji konsistensi seluruh matriks
    consistency_summary = [
        {
            "matrix_name": "Kriteria (Style, Keandalan, BBM)",
            "lambda_max": criteria_res["lambda_max"],
            "ci": criteria_res["ci"],
            "ri": criteria_res["ri"],
            "cr": criteria_res["cr"],
            "is_consistent": criteria_res["is_consistent"],
            "status": criteria_res["status"]
        }
    ]
    all_consistent = criteria_res["is_consistent"]
    
    for c_key, c_name in zip(criteria_keys, criteria_labels):
        sub_res = alt_res_dict[c_key]
        consistency_summary.append({
            "matrix_name": f"Alternatif terhadap Kriteria {c_name}",
            "lambda_max": sub_res["lambda_max"],
            "ci": sub_res["ci"],
            "ri": sub_res["ri"],
            "cr": sub_res["cr"],
            "is_consistent": sub_res["is_consistent"],
            "status": sub_res["status"]
        })
        if not sub_res["is_consistent"]:
            all_consistent = False

    return {
        "criteria_weights": {c_name: float(w) for c_name, w in zip(criteria_labels, crit_weights)},
        "alt_weight_matrix": alt_matrix.tolist(),
        "weighted_matrix": weighted_matrix.tolist(),
        "final_scores": {car_name: float(s) for car_name, s in zip(alt_labels, final_scores)},
        "alternatives": alternatives_summary,
        "ranked_alternatives": ranked_alternatives,
        "best_alternative": best_alternative,
        "consistency_summary": consistency_summary,
        "all_consistent": all_consistent
    }
