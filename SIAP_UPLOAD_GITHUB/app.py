"""
Aplikasi Web Flask - Dashboard Sistem Pendukung Keputusan (SPK) Pemilihan Mobil
Metode: Analytical Hierarchy Process (AHP)
Teknologi: Python Flask, Pandas, Openpyxl, NumPy, HTML5, CSS3, JavaScript

File ini berfungsi sebagai server backend dan penyedia REST API untuk frontend dashboard.
"""

import os
import io
import json
from flask import Flask, render_template, jsonify, request, send_file, redirect, url_for, flash
from werkzeug.utils import secure_filename

from ahp import calculate_ahp_matrix, synthesize_ahp
from data_loader import (
    load_data_from_excel,
    get_default_dataset,
    validate_matrix,
    export_results_to_csv,
    export_results_to_excel,
    DEFAULT_EXCEL_PATH
)

app = Flask(__name__)
app.secret_key = "ahp_decision_support_secret_key_2026"

# Konfigurasi folder upload
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # Max 16MB

ALLOWED_EXTENSIONS = {"xlsx", "xls"}

# State memori untuk data aktif saat ini
# Memungkinkan aplikasi bekerja cepat tanpa re-read disk berulang,
# sekaligus mendukung upload data baru secara instan
CURRENT_DATA = None
CURRENT_RESULTS = None


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def compute_all_ahp(data_dict: dict) -> dict:
    """
    Menjalankan seluruh pipa perhitungan AHP berdasarkan data input:
    1. Perhitungan AHP untuk Matriks Kriteria
    2. Perhitungan AHP untuk setiap Matriks Alternatif per Kriteria
    3. Sintesis dan perankingan akhir
    """
    crit_matrix = data_dict["criteria_matrix"]
    crit_labels = data_dict["criteria_labels"]
    crit_keys = data_dict["criteria_keys"]
    alternatives = data_dict["alternatives"]
    alt_matrices = data_dict["alt_matrices"]

    # 1. Hitung matriks kriteria
    crit_calc = calculate_ahp_matrix(
        crit_matrix,
        labels=crit_labels,
        title="Matriks Perbandingan Berpasangan Kriteria"
    )

    # 2. Hitung matriks alternatif untuk setiap kriteria
    alt_calcs = {}
    for key, label in zip(crit_keys, crit_labels):
        sub_mat = alt_matrices[key]
        alt_calcs[key] = calculate_ahp_matrix(
            sub_mat,
            labels=alternatives,
            title=f"Matriks Perbandingan Alternatif - Kriteria {label}"
        )

    # 3. Sintesis akhir
    synthesis = synthesize_ahp(
        criteria_res=crit_calc,
        alt_res_dict=alt_calcs,
        alt_labels=alternatives,
        criteria_labels=crit_labels,
        criteria_keys=crit_keys
    )

    return {
        "source": data_dict.get("source", "AHP_Studi_Kasus_Mobil.xlsx"),
        "criteria_keys": crit_keys,
        "criteria_labels": crit_labels,
        "alternatives": alternatives,
        "criteria_calculation": crit_calc,
        "alternatives_calculation": alt_calcs,
        "synthesis": synthesis
    }


def get_current_pipeline():
    """Mengambil atau menginisialisasi pipa data dan hasil AHP aktif."""
    global CURRENT_DATA, CURRENT_RESULTS
    if CURRENT_DATA is None or CURRENT_RESULTS is None:
        CURRENT_DATA = load_data_from_excel(DEFAULT_EXCEL_PATH)
        CURRENT_RESULTS = compute_all_ahp(CURRENT_DATA)
    return CURRENT_DATA, CURRENT_RESULTS


# ============================================================================
# ROUTE HALAMAN (JINJA2 TEMPLATES)
# ============================================================================

@app.route("/")
def page_dashboard():
    """Halaman Dashboard Utama"""
    return render_template("index.html", active_page="dashboard")


@app.route("/alternatif")
def page_alternatif():
    """Halaman Data Alternatif Mobil"""
    return render_template("alternatif.html", active_page="alternatif")


@app.route("/kriteria")
def page_kriteria():
    """Halaman Data Kriteria & Bobot"""
    return render_template("kriteria.html", active_page="kriteria")


@app.route("/perhitungan")
def page_perhitungan():
    """Halaman Detail Tahapan Perhitungan AHP"""
    return render_template("perhitungan.html", active_page="perhitungan")


@app.route("/hasil")
def page_hasil():
    """Halaman Hasil Rekomendasi & Uji Konsistensi"""
    return render_template("hasil.html", active_page="hasil")


# ============================================================================
# ROUTE REST API (DIPANGGIL OLEH JAVASCRIPT FETCH)
# ============================================================================

@app.route("/api/dashboard", methods=["GET"])
def api_dashboard():
    """Endpoint ringkasan metrik dashboard, grafik peringkat, dan bobot kriteria."""
    _, results = get_current_pipeline()
    synth = results["synthesis"]
    crit_calc = results["criteria_calculation"]

    # Menyiapkan data grafik ranking
    ranked_alts = synth["ranked_alternatives"]
    chart_ranking = {
        "labels": [a["name"] for a in ranked_alts],
        "scores": [round(a["final_score"], 4) for a in ranked_alts],
        "percentages": [round(a["final_score_percent"], 2) for a in ranked_alts],
        "ranks": [a["rank"] for a in ranked_alts]
    }

    # Menyiapkan data grafik bobot kriteria
    chart_criteria = {
        "labels": results["criteria_labels"],
        "short_labels": results["criteria_keys"],
        "weights": [round(w, 4) for w in crit_calc["weights"]],
        "percentages": [round(w * 100, 2) for w in crit_calc["weights"]]
    }

    # Ringkasan cepat
    best_car = synth["best_alternative"]

    return jsonify({
        "status": "success",
        "data_source": results["source"],
        "total_alternatives": len(results["alternatives"]),
        "total_criteria": len(results["criteria_labels"]),
        "best_car": {
            "name": best_car["name"] if best_car else "-",
            "score": round(best_car["final_score"], 4) if best_car else 0,
            "score_percent": round(best_car["final_score_percent"], 2) if best_car else 0,
            "rank": best_car["rank"] if best_car else 1
        },
        "all_consistent": synth["all_consistent"],
        "chart_ranking": chart_ranking,
        "chart_criteria": chart_criteria,
        "consistency_summary": synth["consistency_summary"]
    })


@app.route("/api/alternatif", methods=["GET"])
def api_alternatif():
    """Endpoint data mobil alternatif lengkap dengan nilai per kriteria & peringkat."""
    _, results = get_current_pipeline()
    synth = results["synthesis"]

    return jsonify({
        "status": "success",
        "data_source": results["source"],
        "total": len(results["alternatives"]),
        "criteria_labels": results["criteria_labels"],
        "alternatives": synth["ranked_alternatives"]
    })


@app.route("/api/kriteria", methods=["GET"])
def api_kriteria():
    """Endpoint data kriteria, matriks perbandingan, bobot prioritas, dan uji konsistensi."""
    _, results = get_current_pipeline()
    crit_calc = results["criteria_calculation"]

    return jsonify({
        "status": "success",
        "data_source": results["source"],
        "criteria_keys": results["criteria_keys"],
        "criteria_labels": results["criteria_labels"],
        "calculation": crit_calc
    })


@app.route("/api/perhitungan", methods=["GET"])
def api_perhitungan():
    """Endpoint detail komprehensif tahapan matematis AHP dari awal hingga akhir."""
    _, results = get_current_pipeline()

    return jsonify({
        "status": "success",
        "data_source": results["source"],
        "criteria_labels": results["criteria_labels"],
        "criteria_keys": results["criteria_keys"],
        "alternatives": results["alternatives"],
        "step1_criteria": results["criteria_calculation"],
        "step2_alternatives": results["alternatives_calculation"],
        "step3_synthesis": {
            "alt_weight_matrix": results["synthesis"]["alt_weight_matrix"],
            "criteria_weights": results["synthesis"]["criteria_weights"],
            "weighted_matrix": results["synthesis"]["weighted_matrix"],
            "ranked_alternatives": results["synthesis"]["ranked_alternatives"]
        },
        "consistency_summary": results["synthesis"]["consistency_summary"]
    })


@app.route("/api/hasil", methods=["GET"])
def api_hasil():
    """Endpoint hasil akhir, perankingan lengkap, analisis rekomendasi, dan status konsistensi."""
    _, results = get_current_pipeline()
    synth = results["synthesis"]

    return jsonify({
        "status": "success",
        "data_source": results["source"],
        "ranked_alternatives": synth["ranked_alternatives"],
        "best_alternative": synth["best_alternative"],
        "criteria_weights": synth["criteria_weights"],
        "consistency_summary": synth["consistency_summary"],
        "all_consistent": synth["all_consistent"]
    })


@app.route("/api/upload", methods=["POST"])
def api_upload():
    """
    Endpoint upload file Excel baru.
    Menerima file .xlsx atau .xls, membaca matriks, memvalidasi format,
    menghitung ulang algoritma AHP, dan mengembalikan hasil baru.
    """
    global CURRENT_DATA, CURRENT_RESULTS

    if "file" not in request.files:
        return jsonify({"status": "error", "message": "Tidak ada file yang diunggah"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "Nama file kosong"}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "Format file tidak didukung. Harap unggah file .xlsx atau .xls"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(save_path)

    try:
        # Muat dan validasi data baru dari Excel
        new_data = load_data_from_excel(save_path)
        
        # Validasi minimal
        is_val, msg = validate_matrix(new_data["criteria_matrix"], len(new_data["criteria_keys"]))
        if not is_val:
            return jsonify({"status": "error", "message": f"Validasi matriks kriteria gagal: {msg}"}), 400

        for k in new_data["criteria_keys"]:
            is_val_alt, msg_alt = validate_matrix(new_data["alt_matrices"][k], len(new_data["alternatives"]))
            if not is_val_alt:
                return jsonify({"status": "error", "message": f"Validasi matriks alternatif '{k}' gagal: {msg_alt}"}), 400

        # Hitung ulang AHP
        new_results = compute_all_ahp(new_data)
        CURRENT_DATA = new_data
        CURRENT_RESULTS = new_results

        return jsonify({
            "status": "success",
            "message": f"File '{filename}' berhasil diunggah dan data AHP berhasil dihitung ulang!",
            "best_car": new_results["synthesis"]["best_alternative"]["name"],
            "score": round(new_results["synthesis"]["best_alternative"]["final_score"], 4)
        })

    except Exception as e:
        return jsonify({"status": "error", "message": f"Gagal memproses file Excel: {str(e)}"}), 500


@app.route("/api/reset", methods=["POST"])
def api_reset():
    """Endpoint untuk mereset data kembali ke file Excel bawaan asli."""
    global CURRENT_DATA, CURRENT_RESULTS
    try:
        CURRENT_DATA = load_data_from_excel(DEFAULT_EXCEL_PATH)
        CURRENT_RESULTS = compute_all_ahp(CURRENT_DATA)
        return jsonify({
            "status": "success",
            "message": "Data berhasil direset ke dataset asli AHP_Studi_Kasus_Mobil.xlsx",
            "best_car": CURRENT_RESULTS["synthesis"]["best_alternative"]["name"]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/export/csv", methods=["GET"])
def api_export_csv():
    """Endpoint download laporan hasil perankingan AHP dalam format CSV."""
    _, results = get_current_pipeline()
    csv_content = export_results_to_csv(results["synthesis"])

    output = io.BytesIO()
    output.write(csv_content.encode("utf-8-sig"))  # BOM untuk kompatibilitas Excel
    output.seek(0)

    return send_file(
        output,
        mimetype="text/csv",
        as_attachment=True,
        download_name="Hasil_AHP_Pemilihan_Mobil.csv"
    )


@app.route("/api/export/excel", methods=["GET"])
def api_export_excel():
    """Endpoint download laporan hasil perankingan AHP dalam format Excel (.xlsx)."""
    _, results = get_current_pipeline()
    excel_stream = export_results_to_excel(results["synthesis"])

    return send_file(
        excel_stream,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="Laporan_Lengkap_AHP_Mobil.xlsx"
    )


if __name__ == "__main__":
    print("================================================================")
    print("  DASHBOARD SPK PEMILIHAN MOBIL - METODE AHP")
    print("  Server berjalan di: http://127.0.0.1:5000")
    print("  Tekan Ctrl+C untuk menghentikan server")
    print("================================================================")
    app.run(debug=True, host="127.0.0.1", port=5000)
