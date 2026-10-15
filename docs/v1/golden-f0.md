# Golden F0 — fixture `month-2026-09`

Sel angka di `cells.csv`: 8422 (DoD Fase 0: ≥ 2.500).

## prd-targets (F0) — 50/50 lulus

Angka target PRD §8 = sel WP yang dirujuk (integritas fixture)

| ID | Pos | Sel WP | Target | Nilai WP | Selisih | Toleransi | Status |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| B2.pool_total | Total pool konversi | BIAYA BERSAMA!C87 | 1572766737.19 | 1572766737.19 | 0 | 1 | LULUS |
| B2.pool_A | Pool Grup A | BIAYA BERSAMA!C81 | 469314556.75 | 469314556.7522302 | 0.0022302 | 1 | LULUS |
| B2.pool_KUPAS | Pool Kupas | BIAYA BERSAMA!C82 | 53598624.96 | 53598624.96108998 | 0.00108998 | 1 | LULUS |
| B2.pool_B | Pool Grup B | BIAYA BERSAMA!C83 | 419567213.29 | 419567213.2866798 | -0.0033202 | 1 | LULUS |
| B2.pool_C | Pool Grup C | BIAYA BERSAMA!C84 | 46737260 | 46737260 | 0 | 1 | LULUS |
| B2.pool_D | Pool Grup D | BIAYA BERSAMA!C85 | 313485769.27 | 313485769.27 | 0 | 1 | LULUS |
| B2.pool_E | Pool Grup E | BIAYA BERSAMA!C86 | 270063312.92 | 270063312.92 | 0 | 1 | LULUS |
| B2.pool_fixed | Pool tetap | BIAYA BERSAMA!D87 | 806327113.62 | 806327113.6200001 | 1e-7 | 1 | LULUS |
| B2.alloc_FCC | Alokasi ke FCC | BIAYA BERSAMA!C121 | 1287026419.50 | 1287026419.4982824 | -0.0017176 | 1 | LULUS |
| B2.alloc_UU | Alokasi ke UU | BIAYA BERSAMA!D121 | 5780271.39 | 5780271.389822661 | -0.000177339 | 1 | LULUS |
| B2.alloc_UO | Alokasi ke UO | BIAYA BERSAMA!E121 | 78965900.38 | 78965900.3825849 | 0.0025849 | 1 | LULUS |
| B2.alloc_LAIN | Alokasi ke Lain-lain | BIAYA BERSAMA!F121 | 200994145.92 | 200994145.91931003 | -0.00068997 | 1 | LULUS |
| B2.fcc_cost | FCC biaya produksi | FCC!E66 | 5562568465.96 | 5562568465.957726 | -0.002274 | 1 | LULUS |
| B2.fcc_cost_per_kg | FCC biaya produksi per kg | FCC!F66 | 23478.381 | 23478.381018127093 | 0.0000181271 | 0.001 | LULUS |
| B2.fcc_rate | FCC biaya rata-rata tertimbang per kg | FCC!D76 | 23928.4692 | 23928.469175256225 | -0.0000247438 | 0.0001 | LULUS |
| B2.fcc_hpp | FCC HPP | FCC!E104 | 5106312148.26 | 5106312148.257679 | -0.002321 | 1 | LULUS |
| B2.fcc_transfer | FCC transfer ke Lain-lain | FCC!E91 | 551835128.88 | 551835128.8849223 | 0.0049223 | 1 | LULUS |
| B2.uu_hpp | UU HPP | UU!E98 | 232706417.35 | 232706417.34778276 | -0.00221724 | 1 | LULUS |
| B2.uo_hpp | UO HPP (PRD: 252.566.6xx) | UO!E94 | 252566650 | 252566602.57611576 | -47.4239 | 50 | LULUS |
| B2.others_cost | Lain-lain biaya produksi | LAIN-LAIN!G68 | 870978077.67 | 870978077.6720028 | 0.0020028 | 1 | LULUS |
| B2.cemcem_ori_cost | Cem-cem ORI biaya produksi | LAIN-LAIN!G47 | 318461224.94 | 318461224.9423175 | 0.0023175 | 1 | LULUS |
| B2.others_hpp | HPP Lain-lain | LAIN-LAIN!G93 | 871581725.61 | 871581725.6075468 | -0.0024532 | 1 | LULUS |
| B3.hpp_card | HPP kartu (Rp jt) | RINGKASAN!B29 | 6463.1669 | 6463.1668937891245 | -0.00000621088 | 0.0001 | LULUS |
| B3.hpp_gl | HPP GL (Rp jt) | RINGKASAN!B34 | 6375.4123 | 6375.41230437 | 0.00000437 | 0.0001 | LULUS |
| B3.recon_material | Rekon: varian material (Rp jt) | REKON & KONTROL!C38 | -121.1482 | -121.14819029890805 | 0.00000970109 | 0.0001 | LULUS |
| B3.recon_inv_wp | Rekon: kenaikan persediaan WP (Rp jt) | REKON & KONTROL!C39 | -326.5394 | -326.5394441128789 | -0.0000441129 | 0.0001 | LULUS |
| B3.recon_inv_gl | Rekon: − kenaikan persediaan GL (Rp jt) | REKON & KONTROL!C40 | 409.3055 | 409.30549090000096 | -0.0000091 | 0.0001 | LULUS |
| B3.recon_kw2 | Rekon: KW 2 pada NRV (Rp jt) | REKON & KONTROL!C41 | -25.5969 | -25.596895951567248 | 0.00000404843 | 0.0001 | LULUS |
| B3.recon_b8 | Rekon: − penyesuaian bagian 8 (Rp jt) | REKON & KONTROL!C42 | -23.7756 | -23.775557170000017 | 0.00004283 | 0.0001 | LULUS |
| B3.recon_idle | Rekon: jam menganggur (Rp jt) | REKON & KONTROL!C43 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.recon_residual | Rekon: sisa (≤ Rp 0,001 jt) | RINGKASAN!B35 | 0 | 0.0000072142292992793955 | 0.00000721423 | 0.001 | LULUS |
| B3.bs_1106_001_wp | 1106-001 WP (Rp jt) | RINGKASAN!B46 | 826.0313 | 826.0312756199996 | -0.00002438 | 0.0001 | LULUS |
| B3.bs_1106_001_gl | 1106-001 GL (Rp jt) | RINGKASAN!C46 | 947.1795 | 947.1794586900005 | -0.00004131 | 0.0001 | LULUS |
| B3.bs_1106_001_expl | 1106-001 dijelaskan (Rp jt) | RINGKASAN!F46 | -121.1482 | -121.14819029890805 | 0.00000970109 | 0.0001 | LULUS |
| B3.bs_wip_wp | WIP WP (Rp jt) | RINGKASAN!B47 | 51.9846 | 51.98459928324415 | -7.16756e-7 | 0.0001 | LULUS |
| B3.bs_wip_gl | WIP GL (Rp jt) | RINGKASAN!C47 | 297.8507 | 297.85070621999995 | 0.00000622 | 0.0001 | LULUS |
| B3.bs_wip_expl | WIP dijelaskan (Rp jt) | RINGKASAN!F47 | -245.8661 | -245.8661069367561 | -0.00000693676 | 0.0001 | LULUS |
| B3.bs_fg_wp | FG WP (Rp jt) | RINGKASAN!B48 | 14.1713 | 14.171280852956015 | -0.000019147 | 0.0001 | LULUS |
| B3.bs_fg_gl | FG GL (Rp jt) | RINGKASAN!C48 | 286.5366 | 286.53663963999907 | 0.00003964 | 0.0001 | LULUS |
| B3.bs_fg_expl | FG dijelaskan (Rp jt) | RINGKASAN!F48 | -272.3654 | -272.36535878704404 | 0.000041213 | 0.0001 | LULUS |
| B3.k2_wip_close | REKON PERSEDIAAN K2 WIP akhir | REKON PERSEDIAAN!H58 | 225691966.25 | 225691966.25 | 0 | 1 | LULUS |
| B3.b21_card | B21 FG masuk kartu (kg) | FCC!B87 | 221027 | 221027 | 0 | 0.01 | LULUS |
| B3.b21_accurate | B21 FG masuk Accurate (kg) | FCC!C206 | 211979.5 | 211979.5 | 0 | 0.01 | LULUS |
| B3.b22_card | B22 transfer kartu (kg) | FCC!B91 | 23115.5 | 23115.5 | 0 | 0.01 | LULUS |
| B3.b22_accurate | B22 transfer Accurate (kg) | FCC!C207 | 14058 | 14058 | 0 | 0.01 | LULUS |
| B4.bridge_aug_pp | Margin GL Agu (pp) | BRIDGE GP!C117 | 19.9219 | 19.921931436113294 | 0.0000314361 | 0.0001 | LULUS |
| B4.bridge_sep_pp | Margin GL Sep (pp) | BRIDGE GP!C135 | 14.5657 | 14.565738351602166 | 0.0000383516 | 0.0001 | LULUS |
| CTX.production_kg | Produksi total (kg) | RINGKASAN!F7 | 289759.42 | 289759.42 | 0 | 0.01 | LULUS |
| CTX.revenue_jt | Pendapatan (Rp jt) | RINGKASAN!F11 | 7462.3602 | 7462.3601526600005 | -0.00004734 | 0.0001 | LULUS |
| CTX.idle_hours | Jam menganggur Unit I | BIAYA BERSAMA!C107 | 3264.8168 | 3264.8167666666013 | -0.0000333334 | 0.0001 | LULUS |

Semua sel golden lulus.
