# Golden F34 — fixture `month-2026-09`

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

## f3-recon (F3) — 1047/1047 lulus

B3 rekon dan kontrol (recon.ts) = sel WP: REKON & KONTROL bagian 2–5, REKON MATERIAL, REKON PERSEDIAAN, RINGKASAN bagian 4–5

| ID | Pos | Sel WP | Target | Nilai WP | Selisih | Toleransi | Status |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| B3.hpp.hpp_card | HPP kartu baru, semua produk | REKON & KONTROL!C37 | 6463.16689378912432 | 6463.1668937891245 | 1.8e-13 | 0.000001 | LULUS |
| B3.hpp.material_variance | Varian material (GL − kartu) | REKON & KONTROL!C38 | -121.1481902989076785 | -121.14819029890805 | -3.715e-13 | 0.000001 | LULUS |
| B3.hpp.inv_increase_wp | Kenaikan persediaan WIP dan barang jadi menurut kartu baru | REKON & KONTROL!C39 | -326.539444112878878 | -326.5394441128789 | -2.2e-14 | 0.000001 | LULUS |
| B3.hpp.inv_increase_gl | Dikurangi kenaikan persediaan WIP dan barang jadi menurut GL | REKON & KONTROL!C40 | 409.305490900001 | 409.30549090000096 | -4e-14 | 0.000001 | LULUS |
| B3.hpp.kw2_nrv | Kenaikan persediaan KW 2 pada NRV (tidak dicatat di GL) | REKON & KONTROL!C41 | -25.59689595156724807181354266679 | -25.596895951567248 | 7.18135e-17 | 0.000001 | LULUS |
| B3.hpp.section8 | Dikurangi penyesuaian DL/FOH dan cut-off yang masuk kartu | REKON & KONTROL!C42 | -23.77555717 | -23.775557170000017 | -1.7e-14 | 0.000001 | LULUS |
| B3.hpp.idle_period | Biaya jam menganggur dibebankan ke periode | REKON & KONTROL!C43 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.hpp.hpp_recon | HPP menurut rekonsiliasi | REKON & KONTROL!C44 | 6375.41229715577151542818645733321 | 6375.412297155771 | -5.15428e-13 | 0.000001 | LULUS |
| B3.hpp.hpp_gl | HPP menurut GL | REKON & KONTROL!C45 | 6375.41230437 | 6375.41230437 | 0 | 0.000001 | LULUS |
| B3.hpp.residual | Sisa: HPP GL − HPP rekonsiliasi | REKON & KONTROL!C46 | 0.00000721422848457181354266679 | 0.0000072142292992793955 | 8.14708e-13 | 0.000001 | LULUS |
| B3.hpp.inventory_gap | Selisih kenaikan persediaan kartu baru vs GL | REKON & KONTROL!C47 | 82.766046787122122 | 82.76604678712204 | -8.2e-14 | 0.000001 | LULUS |
| B3.mat.card_total | Total material kartu | REKON & KONTROL!B28 | 4496.3663515346776785 | 4496.366351534678 | 3.215e-13 | 0.000001 | LULUS |
| B3.mat.variance | Varian material GL − kartu | REKON & KONTROL!B30 | -121.1481902989076785 | -121.14819029890805 | -3.715e-13 | 0.000001 | LULUS |
| B3.mat.share.FCC | Porsi material FCC | REKON & KONTROL!C22 | 0.9415702036855686427025812457351938522175 | 0.9415702036855685 | -1.42703e-16 | 0.0001 | LULUS |
| B3.mat.var.FCC | Varian material FCC | REKON & KONTROL!D22 | -114.0695262158805339125998931913884806156 | -114.06952621588087 | -3.36087e-13 | 0.000001 | LULUS |
| B3.mat.share.UU | Porsi material UU | REKON & KONTROL!C23 | 0.002768335226735956628828318437262806685145 | 0.002768335226735956 | -6.28828e-19 | 0.0001 | LULUS |
| B3.mat.var.UU | Varian material UU | REKON & KONTROL!D23 | -0.3353788028597774094344685278177764233662 | -0.3353788028597784 | -9.90566e-16 | 0.000001 | LULUS |
| B3.mat.share.UO | Porsi material UO | REKON & KONTROL!C24 | 0.03860910980580537459859671396397731818628 | 0.03860910980580537 | -4.5986e-18 | 0.0001 | LULUS |
| B3.mat.var.UO | Varian material UO | REKON & KONTROL!D24 | -4.677423782025132005896838780772990428023 | -4.677423782025146 | -1.39941e-14 | 0.000001 | LULUS |
| B3.mat.share.LAIN_SINGKONG | Porsi material LAIN_SINGKONG | REKON & KONTROL!C25 | 0.01705235128189002606999372186356602291111 | 0.017052351281890026 | -6.99937e-20 | 0.0001 | LULUS |
| B3.mat.var.LAIN_SINGKONG | Varian material LAIN_SINGKONG | REKON & KONTROL!D25 | -2.065861498142235172068799500020752532993 | -2.0658614981422416 | -6.42793e-15 | 0.000001 | LULUS |
| B3.mat.share.LAIN_UBI_UNGU | Porsi material LAIN_UBI_UNGU | REKON & KONTROL!C26 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.mat.var.LAIN_UBI_UNGU | Varian material LAIN_UBI_UNGU | REKON & KONTROL!D26 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.mat.share.LAIN_UBI_ORANGE | Porsi material LAIN_UBI_ORANGE | REKON & KONTROL!C27 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.mat.var.LAIN_UBI_ORANGE | Varian material LAIN_UBI_ORANGE | REKON & KONTROL!D27 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.mat.var.total | Σ varian material per lini | REKON & KONTROL!D28 | -121.1481902989076785 | -121.14819029890803 | -3.515e-13 | 0.000001 | LULUS |
| B3.mat.acc.5101-301 | Varian akun 5101-301 | REKON & KONTROL!D31 | -116.1353877140227690846686926914092331486 | -116.13538771402311 | -3.40915e-13 | 0.000001 | LULUS |
| B3.mat.acc.5101-302 | Varian akun 5101-302 | REKON & KONTROL!D32 | -0.3353788028597774094344685278177764233662 | -0.3353788028597784 | -9.90566e-16 | 0.000001 | LULUS |
| B3.mat.acc.5101-303 | Varian akun 5101-303 | REKON & KONTROL!D33 | -4.677423782025132005896838780772990428023 | -4.677423782025146 | -1.39941e-14 | 0.000001 | LULUS |
| B3.kw2.in.kg | Masuk: KW 2 dari produksi FCC (kg) | REKON & KONTROL!C52 | 7581 | 7581 | 0 | 0.01 | LULUS |
| B3.kw2.in.rp | Masuk: KW 2 dari produksi FCC (Rp juta) | REKON & KONTROL!D52 | 74.12149282231897833 | 74.12149282231898 | 1.67e-15 | 0.000001 | LULUS |
| B3.kw2.to_others.kg | Keluar: bahan Lain-lain (kg) | REKON & KONTROL!C53 | -4242.000000000003 | -4242.000000000003 | 0 | 0.01 | LULUS |
| B3.kw2.to_others.rp | Keluar: bahan Lain-lain (Rp juta) | REKON & KONTROL!D53 | -41.47518434933087039181354266679 | -41.475184349330874 | -3.60819e-15 | 0.000001 | LULUS |
| B3.kw2.sold.kg | Keluar: KW 2 tawar terjual (HPP pada NRV) (kg) | REKON & KONTROL!C54 | -5957 | -5957 | 0 | 0.01 | LULUS |
| B3.kw2.sold.rp | Keluar: KW 2 tawar terjual (HPP pada NRV) (Rp juta) | REKON & KONTROL!D54 | -58.24320442455535601 | -58.24320442455536 | -3.99e-15 | 0.000001 | LULUS |
| B3.kw2.increase.kg | Kenaikan persediaan KW 2 (kg) | REKON & KONTROL!C55 | -2618.000000000003 | -2618.0000000000027 | 3e-13 | 0.01 | LULUS |
| B3.kw2.increase.rp | Kenaikan persediaan KW 2 (Rp juta) | REKON & KONTROL!D55 | -25.59689595156724807181354266679 | -25.596895951567248 | 7.18135e-17 | 0.000001 | LULUS |
| B3.B17 | B17 konversi kartu = pool − idle | REKON & KONTROL!C59 | -0.000000000000039 | 0 | 3.9e-14 | 0.000001 | LULUS |
| B3.B18 | B18 material + varian = GL | REKON & KONTROL!C60 | 0.0000000000000095 | 0 | -9.5e-15 | 0.000001 | LULUS |
| B3.B19 | B19 sisa rekonsiliasi HPP | REKON & KONTROL!C61 | 0.00000721422848457181354266679 | 0.0000072142292992793955 | 8.14708e-13 | 0.000001 | LULUS |
| B3.others_material | Lini Lain-lain = material Lain-lain | REKON & KONTROL!C62 | -0.0000000000000095 | 0 | 9.5e-15 | 0.000001 | LULUS |
| B3.B20 | B20 pendapatan = GL | REKON & KONTROL!C63 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.sum.hpp_card | HPP kartu | RINGKASAN!B29 | 6463.16689378912432 | 6463.1668937891245 | 1.8e-13 | 0.000001 | LULUS |
| B3.sum.material_variance | Varian material | RINGKASAN!B30 | -121.1481902989076785 | -121.14819029890805 | -3.715e-13 | 0.000001 | LULUS |
| B3.sum.inventory_gap | Selisih kenaikan persediaan | RINGKASAN!B31 | 82.766046787122122 | 82.76604678712204 | -8.2e-14 | 0.000001 | LULUS |
| B3.sum.kw2 | KW 2 pada NRV | RINGKASAN!B32 | -25.59689595156724807181354266679 | -25.596895951567248 | 7.18135e-17 | 0.000001 | LULUS |
| B3.sum.idle | Jam menganggur | RINGKASAN!B33 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.sum.hpp_gl | HPP GL | RINGKASAN!B34 | 6375.41230437 | 6375.41230437 | 0 | 0.000001 | LULUS |
| B3.sum.residual | Sisa | RINGKASAN!B35 | 0.00000721422848457181354266679 | 0.0000072142292992793955 | 8.14708e-13 | 0.000001 | LULUS |
| B3.bs.revenue.B | Pendapatan (B) | RINGKASAN!B40 | 7462.36015266 | 7462.3601526600005 | 5e-13 | 0.000001 | LULUS |
| B3.bs.revenue.C | Pendapatan (C) | RINGKASAN!C40 | 7462.36015266 | 7462.36015266 | 0 | 0.000001 | LULUS |
| B3.bs.revenue.D | Pendapatan (D) | RINGKASAN!D40 | 7462.36015266 | 7462.36015266 | 0 | 0.000001 | LULUS |
| B3.bs.revenue.E | Pendapatan (E) | RINGKASAN!E40 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.bs.revenue.F | Pendapatan (F) | RINGKASAN!F40 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.bs.revenue.G | Pendapatan (G) | RINGKASAN!G40 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.bs.revenue.H | Pendapatan (H) | RINGKASAN!H40 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.bs.material_usage.B | Pemakaian bahan baku (B) | RINGKASAN!B41 | 4496.3663515346776785 | 4496.366351534678 | 3.215e-13 | 0.000001 | LULUS |
| B3.bs.material_usage.C | Pemakaian bahan baku (C) | RINGKASAN!C41 | 4375.21816845 | 4375.21816845 | 0 | 0.000001 | LULUS |
| B3.bs.material_usage.D | Pemakaian bahan baku (D) | RINGKASAN!D41 | 4375.21816124 | 4375.21816124 | 0 | 0.000001 | LULUS |
| B3.bs.material_usage.E | Pemakaian bahan baku (E) | RINGKASAN!E41 | 121.1481830846776785 | 121.14818308467784 | 1.615e-13 | 0.000001 | LULUS |
| B3.bs.material_usage.F | Pemakaian bahan baku (F) | RINGKASAN!F41 | 121.1481902989076785 | 121.14819029890805 | 3.715e-13 | 0.000001 | LULUS |
| B3.bs.material_usage.G | Pemakaian bahan baku (G) | RINGKASAN!G41 | -0.00000721423 | -0.000007214230208774097 | -2.08774e-13 | 0.000001 | LULUS |
| B3.bs.material_usage.H | Pemakaian bahan baku (H) | RINGKASAN!H41 | 0.00000721 | 0.000007210000148916151 | 1.48916e-13 | 0.000001 | LULUS |
| B3.bs.conversion.B | Biaya konversi (DL + FOH) (B) | RINGKASAN!B42 | 1572.766737189999961 | 1572.7667371900002 | 2.39e-13 | 0.000001 | LULUS |
| B3.bs.conversion.C | Biaya konversi (DL + FOH) (C) | RINGKASAN!C42 | 1590.88864502 | 1590.88864502 | 0 | 0.000001 | LULUS |
| B3.bs.conversion.D | Biaya konversi (DL + FOH) (D) | RINGKASAN!D42 | 1590.88864502 | 1590.88864502 | 0 | 0.000001 | LULUS |
| B3.bs.conversion.E | Biaya konversi (DL + FOH) (E) | RINGKASAN!E42 | -18.121907830000039 | -18.121907829999827 | 2.12e-13 | 0.000001 | LULUS |
| B3.bs.conversion.F | Biaya konversi (DL + FOH) (F) | RINGKASAN!F42 | -18.12190783 | -18.121907829999998 | 2e-15 | 0.000001 | LULUS |
| B3.bs.conversion.G | Biaya konversi (DL + FOH) (G) | RINGKASAN!G42 | -0.000000000000039 | 0.00000000000017053025658242404 | 2.0953e-13 | 0.000001 | LULUS |
| B3.bs.conversion.H | Biaya konversi (DL + FOH) (H) | RINGKASAN!H42 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.bs.cogs.B | HPP (B) | RINGKASAN!B43 | 6463.16689378912432 | 6463.1668937891245 | 1.8e-13 | 0.000001 | LULUS |
| B3.bs.cogs.C | HPP (C) | RINGKASAN!C43 | 6375.41230437 | 6375.41230437 | 0 | 0.000001 | LULUS |
| B3.bs.cogs.D | HPP (D) | RINGKASAN!D43 | 6375.41230437 | 6375.41230437 | 0 | 0.000001 | LULUS |
| B3.bs.cogs.E | HPP (E) | RINGKASAN!E43 | 87.75458941912432 | 87.75458941912439 | 7e-14 | 0.000001 | LULUS |
| B3.bs.cogs.F | HPP (F) | RINGKASAN!F43 | 87.75459663335280457181354266679 | 87.75459663335327 | 4.65428e-13 | 0.000001 | LULUS |
| B3.bs.cogs.G | HPP (G) | RINGKASAN!G43 | -0.00000721422848457181354266679 | -0.000007214228887164609 | -4.02593e-13 | 0.000001 | LULUS |
| B3.bs.cogs.H | HPP (H) | RINGKASAN!H43 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.bs.gross_profit.B | Laba kotor (B) | RINGKASAN!B44 | 999.19325887087568 | 999.193258870876 | 3.2e-13 | 0.000001 | LULUS |
| B3.bs.gross_profit.C | Laba kotor (C) | RINGKASAN!C44 | 1086.94784829 | 1086.9478482899995 | -5e-13 | 0.000001 | LULUS |
| B3.bs.gross_profit.D | Laba kotor (D) | RINGKASAN!D44 | 1086.94784829 | 1086.9478482899995 | -5e-13 | 0.000001 | LULUS |
| B3.bs.gross_profit.E | Laba kotor (E) | RINGKASAN!E44 | -87.75458941912432 | -87.75458941912348 | 8.4e-13 | 0.000001 | LULUS |
| B3.bs.gross_profit.F | Laba kotor (F) | RINGKASAN!F44 | -87.75459663335280457181354266679 | -87.75459663335327 | -4.65428e-13 | 0.000001 | LULUS |
| B3.bs.gross_profit.G | Laba kotor (G) | RINGKASAN!G44 | 0.00000721422848457181354266679 | 0.0000072142297966593105 | 1.31209e-12 | 0.000001 | LULUS |
| B3.bs.gross_profit.H | Laba kotor (H) | RINGKASAN!H44 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.bs.inv_1106_001.B | Persediaan bahan baku 1106-001 (B) | RINGKASAN!B46 | 826.03127562 | 826.0312756199996 | -4e-13 | 0.000001 | LULUS |
| B3.bs.inv_1106_001.C | Persediaan bahan baku 1106-001 (C) | RINGKASAN!C46 | 947.17945869 | 947.1794586900005 | 5e-13 | 0.000001 | LULUS |
| B3.bs.inv_1106_001.D | Persediaan bahan baku 1106-001 (D) | RINGKASAN!D46 | 947.17940289 | 947.17940289 | 0 | 0.000001 | LULUS |
| B3.bs.inv_1106_001.E | Persediaan bahan baku 1106-001 (E) | RINGKASAN!E46 | -121.14818307 | -121.14818307000087 | -8.7e-13 | 0.000001 | LULUS |
| B3.bs.inv_1106_001.F | Persediaan bahan baku 1106-001 (F) | RINGKASAN!F46 | -121.1481902989076785 | -121.14819029890805 | -3.715e-13 | 0.000001 | LULUS |
| B3.bs.inv_1106_001.G | Persediaan bahan baku 1106-001 (G) | RINGKASAN!G46 | 0.0000072289076785 | 0.000007228907179523958 | -4.98976e-13 | 0.000001 | LULUS |
| B3.bs.inv_1106_001.H | Persediaan bahan baku 1106-001 (H) | RINGKASAN!H46 | 0.0000558 | 0.000055800000495764834 | 4.95765e-13 | 0.000001 | LULUS |
| B3.bs.inv_1106_002.B | Persediaan barang setengah jadi 1106-002 (B) | RINGKASAN!B47 | 51.98459928324415 | 51.98459928324415 | 0 | 0.000001 | LULUS |
| B3.bs.inv_1106_002.C | Persediaan barang setengah jadi 1106-002 (C) | RINGKASAN!C47 | 297.85070622 | 297.85070621999995 | -5e-14 | 0.000001 | LULUS |
| B3.bs.inv_1106_002.D | Persediaan barang setengah jadi 1106-002 (D) | RINGKASAN!D47 | 297.85070622 | 297.85070622 | 0 | 0.000001 | LULUS |
| B3.bs.inv_1106_002.E | Persediaan barang setengah jadi 1106-002 (E) | RINGKASAN!E47 | -245.86610693675585 | -245.86610693675578 | 7e-14 | 0.000001 | LULUS |
| B3.bs.inv_1106_002.F | Persediaan barang setengah jadi 1106-002 (F) | RINGKASAN!F47 | -245.86610693675585 | -245.8661069367561 | -2.5e-13 | 0.000001 | LULUS |
| B3.bs.inv_1106_002.G | Persediaan barang setengah jadi 1106-002 (G) | RINGKASAN!G47 | 0 | 0.0000000000003126388037344441 | 3.12639e-13 | 0.000001 | LULUS |
| B3.bs.inv_1106_002.H | Persediaan barang setengah jadi 1106-002 (H) | RINGKASAN!H47 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.bs.inv_1106_003.B | Persediaan barang jadi 1106-003 (B) | RINGKASAN!B48 | 14.171280852956014 | 14.171280852956015 | 1e-15 | 0.000001 | LULUS |
| B3.bs.inv_1106_003.C | Persediaan barang jadi 1106-003 (C) | RINGKASAN!C48 | 286.536639639999 | 286.53663963999907 | 7e-14 | 0.000001 | LULUS |
| B3.bs.inv_1106_003.D | Persediaan barang jadi 1106-003 (D) | RINGKASAN!D48 | 286.53663964 | 286.53663964 | 0 | 0.000001 | LULUS |
| B3.bs.inv_1106_003.E | Persediaan barang jadi 1106-003 (E) | RINGKASAN!E48 | -272.365358787042986 | -272.3653587870431 | -1.14e-13 | 0.000001 | LULUS |
| B3.bs.inv_1106_003.F | Persediaan barang jadi 1106-003 (F) | RINGKASAN!F48 | -272.365358787043987 | -272.36535878704404 | -5.3e-14 | 0.000001 | LULUS |
| B3.bs.inv_1106_003.G | Persediaan barang jadi 1106-003 (G) | RINGKASAN!G48 | 0.000000000001001 | 0.0000000000009663381206337363 | -3.46619e-14 | 0.000001 | LULUS |
| B3.bs.inv_1106_003.H | Persediaan barang jadi 1106-003 (H) | RINGKASAN!H48 | -0.000000000001 | -0.0000000000009094947017729282 | 9.05053e-14 | 0.000001 | LULUS |
| B3.bs.inv_wip_fg_delta.B | Kenaikan persediaan WIP + barang jadi (B) | RINGKASAN!B49 | -326.539444112878878 | -326.5394441128789 | -2.2e-14 | 0.000001 | LULUS |
| B3.bs.inv_wip_fg_delta.C | Kenaikan persediaan WIP + barang jadi (C) | RINGKASAN!C49 | -409.305490900001 | -409.30549090000096 | 4e-14 | 0.000001 | LULUS |
| B3.bs.inv_wip_fg_delta.D | Kenaikan persediaan WIP + barang jadi (D) | RINGKASAN!D49 | -409.3054909 | -409.3054909 | 0 | 0.000001 | LULUS |
| B3.bs.inv_wip_fg_delta.E | Kenaikan persediaan WIP + barang jadi (E) | RINGKASAN!E49 | 82.766046787122122 | 82.76604678712204 | -8.2e-14 | 0.000001 | LULUS |
| B3.bs.inv_wip_fg_delta.F | Kenaikan persediaan WIP + barang jadi (F) | RINGKASAN!F49 | 82.766046787122122 | 82.76604678712204 | -8.2e-14 | 0.000001 | LULUS |
| B3.bs.inv_wip_fg_delta.G | Kenaikan persediaan WIP + barang jadi (G) | RINGKASAN!G49 | 0 | 0 | 0 | 0.000001 | LULUS |
| B3.bs.inv_wip_fg_delta.H | Kenaikan persediaan WIP + barang jadi (H) | RINGKASAN!H49 | -0.000000000001 | -0.0000000000009663381206337363 | 3.36619e-14 | 0.000001 | LULUS |
| B3.rm.7.H | Singkong Daging Premium: total kartu | REKON MATERIAL!H7 | 1288542000 | 1288542000 | 0 | 1 | LULUS |
| B3.rm.7.L | Singkong Daging Premium: pemakaian Accurate | REKON MATERIAL!L7 | 1288541981.94 | 1288541981.94 | 0 | 1 | LULUS |
| B3.rm.7.M | Singkong Daging Premium: selisih Accurate − kartu | REKON MATERIAL!M7 | -18.06 | -18.05999994277954 | 5.72205e-8 | 1 | LULUS |
| B3.rm.7.N | Singkong Daging Premium: saldo akhir implisit kartu | REKON MATERIAL!N7 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.8.H | Minyak Olein: total kartu | REKON MATERIAL!H8 | 1048172196.58 | 1048172196.58 | 0 | 1 | LULUS |
| B3.rm.8.L | Minyak Olein: pemakaian Accurate | REKON MATERIAL!L8 | 953361455.25 | 953361455.25 | 0 | 1 | LULUS |
| B3.rm.8.M | Minyak Olein: selisih Accurate − kartu | REKON MATERIAL!M8 | -94810741.33 | -94810741.33000004 | -4e-8 | 1 | LULUS |
| B3.rm.8.N | Minyak Olein: saldo akhir implisit kartu | REKON MATERIAL!N8 | 89066792.39 | 89066792.38999999 | -1e-8 | 1 | LULUS |
| B3.rm.9.H | Singkong Kulit Premium: total kartu | REKON MATERIAL!H9 | 1021433573.07 | 1021433573.07 | 0 | 1 | LULUS |
| B3.rm.9.L | Singkong Kulit Premium: pemakaian Accurate | REKON MATERIAL!L9 | 1012361929.88 | 1012361929.88 | 0 | 1 | LULUS |
| B3.rm.9.M | Singkong Kulit Premium: selisih Accurate − kartu | REKON MATERIAL!M9 | -9071643.19 | -9071643.190000057 | -5.7e-8 | 1 | LULUS |
| B3.rm.9.N | Singkong Kulit Premium: saldo akhir implisit kartu | REKON MATERIAL!N9 | -9072325.07 | -9072325.070000052 | -5.2e-8 | 1 | LULUS |
| B3.rm.10.H | CNG: total kartu | REKON MATERIAL!H10 | 799995659.72 | 799995659.72 | 0 | 1 | LULUS |
| B3.rm.10.L | CNG: pemakaian Accurate | REKON MATERIAL!L10 | 799995637.88 | 799995637.88 | 0 | 1 | LULUS |
| B3.rm.10.M | CNG: selisih Accurate − kartu | REKON MATERIAL!M10 | -21.84 | -21.8400000333786 | -3.33786e-8 | 1 | LULUS |
| B3.rm.10.N | CNG: saldo akhir implisit kartu | REKON MATERIAL!N10 | -28.92 | -28.920000076293945 | -7.62939e-8 | 1 | LULUS |
| B3.rm.11.H | HDPE Ukuran IFL Warna Putih Tebal 0,07: total kartu | REKON MATERIAL!H11 | 49574163.43 | 49574163.43 | 0 | 1 | LULUS |
| B3.rm.11.L | HDPE Ukuran IFL Warna Putih Tebal 0,07: pemakaian Accurate | REKON MATERIAL!L11 | 39137496.64 | 39137496.639999986 | -1.4e-8 | 1 | LULUS |
| B3.rm.11.M | HDPE Ukuran IFL Warna Putih Tebal 0,07: selisih Accurate − kartu | REKON MATERIAL!M11 | -10436666.79 | -10436666.790000014 | -1.4e-8 | 1 | LULUS |
| B3.rm.11.N | HDPE Ukuran IFL Warna Putih Tebal 0,07: saldo akhir implisit kartu | REKON MATERIAL!N11 | 151005510.98 | 151005510.98 | 0 | 1 | LULUS |
| B3.rm.12.H | HDPE Ukuran IFL Warna Putih Tebal 0,05: total kartu | REKON MATERIAL!H12 | 63982187.7 | 63982187.7 | 0 | 1 | LULUS |
| B3.rm.12.L | HDPE Ukuran IFL Warna Putih Tebal 0,05: pemakaian Accurate | REKON MATERIAL!L12 | 56727894.3 | 56727894.30000001 | 1e-8 | 1 | LULUS |
| B3.rm.12.M | HDPE Ukuran IFL Warna Putih Tebal 0,05: selisih Accurate − kartu | REKON MATERIAL!M12 | -7254293.4 | -7254293.399999991 | 9e-9 | 1 | LULUS |
| B3.rm.12.N | HDPE Ukuran IFL Warna Putih Tebal 0,05: saldo akhir implisit kartu | REKON MATERIAL!N12 | 134565439.36 | 134565439.36 | 0 | 1 | LULUS |
| B3.rm.13.H | Karton Polos IFL: total kartu | REKON MATERIAL!H13 | 976176.71 | 976176.71 | 0 | 1 | LULUS |
| B3.rm.13.L | Karton Polos IFL: pemakaian Accurate | REKON MATERIAL!L13 | 1.12 | 1.1200000047683716 | 4.76837e-9 | 1 | LULUS |
| B3.rm.13.M | Karton Polos IFL: selisih Accurate − kartu | REKON MATERIAL!M13 | -976175.59 | -976175.5899999952 | 4.8e-9 | 1 | LULUS |
| B3.rm.13.N | Karton Polos IFL: saldo akhir implisit kartu | REKON MATERIAL!N13 | 169659511.79 | 169659511.79 | 0 | 1 | LULUS |
| B3.rm.14.H | Ubi Orange Kulit Merah: total kartu | REKON MATERIAL!H14 | 113015300 | 113015300 | 0 | 1 | LULUS |
| B3.rm.14.L | Ubi Orange Kulit Merah: pemakaian Accurate | REKON MATERIAL!L14 | 113015295.6 | 113015295.6 | 0 | 1 | LULUS |
| B3.rm.14.M | Ubi Orange Kulit Merah: selisih Accurate − kartu | REKON MATERIAL!M14 | -4.4 | -4.4000000059604645 | -5.96046e-9 | 1 | LULUS |
| B3.rm.14.N | Ubi Orange Kulit Merah: saldo akhir implisit kartu | REKON MATERIAL!N14 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.15.H | Ubi Putih ACE: total kartu | REKON MATERIAL!H15 | 68748451.94 | 68748451.94 | 0 | 1 | LULUS |
| B3.rm.15.L | Ubi Putih ACE: pemakaian Accurate | REKON MATERIAL!L15 | 69865898.9 | 69865898.9 | 0 | 1 | LULUS |
| B3.rm.15.M | Ubi Putih ACE: selisih Accurate − kartu | REKON MATERIAL!M15 | 1117446.96 | 1117446.9600000083 | 8.3e-9 | 1 | LULUS |
| B3.rm.15.N | Ubi Putih ACE: saldo akhir implisit kartu | REKON MATERIAL!N15 | 1117448.06 | 1117448.0600000024 | 2.4e-9 | 1 | LULUS |
| B3.rm.16.H | Plastik Singkong HD 60*100*0,07: total kartu | REKON MATERIAL!H16 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.16.L | Plastik Singkong HD 60*100*0,07: pemakaian Accurate | REKON MATERIAL!L16 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.16.M | Plastik Singkong HD 60*100*0,07: selisih Accurate − kartu | REKON MATERIAL!M16 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.16.N | Plastik Singkong HD 60*100*0,07: saldo akhir implisit kartu | REKON MATERIAL!N16 | 62031117.81 | 62031117.81 | 0 | 1 | LULUS |
| B3.rm.17.H | Polyfilm Umbis Ubi Ungu Rasa Ubi Bakar: total kartu | REKON MATERIAL!H17 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.17.L | Polyfilm Umbis Ubi Ungu Rasa Ubi Bakar: pemakaian Accurate | REKON MATERIAL!L17 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.17.M | Polyfilm Umbis Ubi Ungu Rasa Ubi Bakar: selisih Accurate − kartu | REKON MATERIAL!M17 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.17.N | Polyfilm Umbis Ubi Ungu Rasa Ubi Bakar: saldo akhir implisit kartu | REKON MATERIAL!N17 | 60870606.06 | 60870606.06 | 0 | 1 | LULUS |
| B3.rm.18.H | HDPE Ukuran IFL Warna Putih Tipis  0,03: total kartu | REKON MATERIAL!H18 | 8256654.7 | 8256654.7 | 0 | 1 | LULUS |
| B3.rm.18.L | HDPE Ukuran IFL Warna Putih Tipis  0,03: pemakaian Accurate | REKON MATERIAL!L18 | 9802122.8 | 9802122.800000004 | 4e-9 | 1 | LULUS |
| B3.rm.18.M | HDPE Ukuran IFL Warna Putih Tipis  0,03: selisih Accurate − kartu | REKON MATERIAL!M18 | 1545468.1 | 1545468.1000000043 | 4.3e-9 | 1 | LULUS |
| B3.rm.18.N | HDPE Ukuran IFL Warna Putih Tipis  0,03: saldo akhir implisit kartu | REKON MATERIAL!N18 | 35970523.01 | 35970523.01 | 0 | 1 | LULUS |
| B3.rm.19.H | Ammonium Bicarbonate (TI): total kartu | REKON MATERIAL!H19 | 7885597.25 | 7885597.25 | 0 | 1 | LULUS |
| B3.rm.19.L | Ammonium Bicarbonate (TI): pemakaian Accurate | REKON MATERIAL!L19 | 7885597.21 | 7885597.210000001 | 1e-9 | 1 | LULUS |
| B3.rm.19.M | Ammonium Bicarbonate (TI): selisih Accurate − kartu | REKON MATERIAL!M19 | -0.04 | -0.03999999910593033 | 8.9407e-10 | 1 | LULUS |
| B3.rm.19.N | Ammonium Bicarbonate (TI): saldo akhir implisit kartu | REKON MATERIAL!N19 | 14495583.19 | 14495583.190000001 | 1e-9 | 1 | LULUS |
| B3.rm.20.H | Bumbu Ubi Bakar Neo 321209: total kartu | REKON MATERIAL!H20 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.20.L | Bumbu Ubi Bakar Neo 321209: pemakaian Accurate | REKON MATERIAL!L20 | 8608.06 | 8608.060000002384 | 2.384e-9 | 1 | LULUS |
| B3.rm.20.M | Bumbu Ubi Bakar Neo 321209: selisih Accurate − kartu | REKON MATERIAL!M20 | 8608.06 | 8608.060000002384 | 2.384e-9 | 1 | LULUS |
| B3.rm.20.N | Bumbu Ubi Bakar Neo 321209: saldo akhir implisit kartu | REKON MATERIAL!N20 | 19129032.26 | 19129032.26 | 0 | 1 | LULUS |
| B3.rm.21.H | Gula Rafinasi: total kartu | REKON MATERIAL!H21 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.21.L | Gula Rafinasi: pemakaian Accurate | REKON MATERIAL!L21 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.21.M | Gula Rafinasi: selisih Accurate − kartu | REKON MATERIAL!M21 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.21.N | Gula Rafinasi: saldo akhir implisit kartu | REKON MATERIAL!N21 | 18838411.08 | 18838411.08 | 0 | 1 | LULUS |
| B3.rm.22.H | Plakban Ukuran 100 Yard: total kartu | REKON MATERIAL!H22 | 5616600 | 5616600 | 0 | 1 | LULUS |
| B3.rm.22.L | Plakban Ukuran 100 Yard: pemakaian Accurate | REKON MATERIAL!L22 | 5504400.25 | 5504400.25 | 0 | 1 | LULUS |
| B3.rm.22.M | Plakban Ukuran 100 Yard: selisih Accurate − kartu | REKON MATERIAL!M22 | -112199.75 | -112199.75 | 0 | 1 | LULUS |
| B3.rm.22.N | Plakban Ukuran 100 Yard: saldo akhir implisit kartu | REKON MATERIAL!N22 | 11965800 | 11965800 | 0 | 1 | LULUS |
| B3.rm.23.H | Bumbu Balado FII-A-01014: total kartu | REKON MATERIAL!H23 | 3399317.7 | 3399317.7 | 0 | 1 | LULUS |
| B3.rm.23.L | Bumbu Balado FII-A-01014: pemakaian Accurate | REKON MATERIAL!L23 | 2005497.08 | 2005497.08 | 0 | 1 | LULUS |
| B3.rm.23.M | Bumbu Balado FII-A-01014: selisih Accurate − kartu | REKON MATERIAL!M23 | -1393820.62 | -1393820.62 | 0 | 1 | LULUS |
| B3.rm.23.N | Bumbu Balado FII-A-01014: saldo akhir implisit kartu | REKON MATERIAL!N23 | 9970663.41 | 9970663.41 | 0 | 1 | LULUS |
| B3.rm.24.H | Plastik HDPE 4 kg: total kartu | REKON MATERIAL!H24 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.24.L | Plastik HDPE 4 kg: pemakaian Accurate | REKON MATERIAL!L24 | 48353.96 | 48353.95999999903 | -9.7e-10 | 1 | LULUS |
| B3.rm.24.M | Plastik HDPE 4 kg: selisih Accurate − kartu | REKON MATERIAL!M24 | 48353.96 | 48353.95999999903 | -9.7e-10 | 1 | LULUS |
| B3.rm.24.N | Plastik HDPE 4 kg: saldo akhir implisit kartu | REKON MATERIAL!N24 | 11810370.27 | 11810370.27 | 0 | 1 | LULUS |
| B3.rm.25.H | Bumbu BBQ Pachira: total kartu | REKON MATERIAL!H25 | 1756180.58 | 1756180.58 | 0 | 1 | LULUS |
| B3.rm.25.L | Bumbu BBQ Pachira: pemakaian Accurate | REKON MATERIAL!L25 | 1063063.26 | 1063063.2599999998 | -2e-10 | 1 | LULUS |
| B3.rm.25.M | Bumbu BBQ Pachira: selisih Accurate − kartu | REKON MATERIAL!M25 | -693117.32 | -693117.3200000003 | -3e-10 | 1 | LULUS |
| B3.rm.25.N | Bumbu BBQ Pachira: saldo akhir implisit kartu | REKON MATERIAL!N25 | 9937515.74 | 9937515.74 | 0 | 1 | LULUS |
| B3.rm.26.H | Ubi Ungu: total kartu | REKON MATERIAL!H26 | 8401600 | 8401600 | 0 | 1 | LULUS |
| B3.rm.26.L | Ubi Ungu: pemakaian Accurate | REKON MATERIAL!L26 | 8401591.24 | 8401591.24 | 0 | 1 | LULUS |
| B3.rm.26.M | Ubi Ungu: selisih Accurate − kartu | REKON MATERIAL!M26 | -8.76 | -8.759999999776483 | 2.23517e-10 | 1 | LULUS |
| B3.rm.26.N | Ubi Ungu: saldo akhir implisit kartu | REKON MATERIAL!N26 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.27.H | Plastik PP 1 kg: total kartu | REKON MATERIAL!H27 | 514661.61 | 514661.61 | 0 | 1 | LULUS |
| B3.rm.27.L | Plastik PP 1 kg: pemakaian Accurate | REKON MATERIAL!L27 | 709089.31 | 709089.3100000005 | 5e-10 | 1 | LULUS |
| B3.rm.27.M | Plastik PP 1 kg: selisih Accurate − kartu | REKON MATERIAL!M27 | 194427.7 | 194427.70000000054 | 5.4e-10 | 1 | LULUS |
| B3.rm.27.N | Plastik PP 1 kg: saldo akhir implisit kartu | REKON MATERIAL!N27 | 7226953.3 | 7226953.3 | 0 | 1 | LULUS |
| B3.rm.28.H | Tali Rafia 1 kg: total kartu | REKON MATERIAL!H28 | 2337099.41 | 2337099.41 | 0 | 1 | LULUS |
| B3.rm.28.L | Tali Rafia 1 kg: pemakaian Accurate | REKON MATERIAL!L28 | 2157322.55 | 2157322.55 | 0 | 1 | LULUS |
| B3.rm.28.M | Tali Rafia 1 kg: selisih Accurate − kartu | REKON MATERIAL!M28 | -179776.86 | -179776.86000000034 | -3.4e-10 | 1 | LULUS |
| B3.rm.28.N | Tali Rafia 1 kg: saldo akhir implisit kartu | REKON MATERIAL!N28 | 3895165.69 | 3895165.6899999995 | -5e-10 | 1 | LULUS |
| B3.rm.29.H | Plastik Suka Suka 40: total kartu | REKON MATERIAL!H29 | 281407.86 | 281407.86 | 0 | 1 | LULUS |
| B3.rm.29.L | Plastik Suka Suka 40: pemakaian Accurate | REKON MATERIAL!L29 | 211055.89 | 211055.88999999966 | -3.4e-10 | 1 | LULUS |
| B3.rm.29.M | Plastik Suka Suka 40: selisih Accurate − kartu | REKON MATERIAL!M29 | -70351.97 | -70351.97000000032 | -3.2e-10 | 1 | LULUS |
| B3.rm.29.N | Plastik Suka Suka 40: saldo akhir implisit kartu | REKON MATERIAL!N29 | 5201944.9 | 5201944.899999999 | -1e-9 | 1 | LULUS |
| B3.rm.30.H | Bumbu Jagung Manis: total kartu | REKON MATERIAL!H30 | 379541.35 | 379541.35 | 0 | 1 | LULUS |
| B3.rm.30.L | Bumbu Jagung Manis: pemakaian Accurate | REKON MATERIAL!L30 | 531570.64 | 531570.6399999997 | -3e-10 | 1 | LULUS |
| B3.rm.30.M | Bumbu Jagung Manis: selisih Accurate − kartu | REKON MATERIAL!M30 | 152029.29 | 152029.2899999997 | -3e-10 | 1 | LULUS |
| B3.rm.30.N | Bumbu Jagung Manis: saldo akhir implisit kartu | REKON MATERIAL!N30 | 4936163.9 | 4936163.9 | 0 | 1 | LULUS |
| B3.rm.31.H | Label FCC Hijau: total kartu | REKON MATERIAL!H31 | 2979025.65 | 2979025.65 | 0 | 1 | LULUS |
| B3.rm.31.L | Label FCC Hijau: pemakaian Accurate | REKON MATERIAL!L31 | 1066522.41 | 1066522.41 | 0 | 1 | LULUS |
| B3.rm.31.M | Label FCC Hijau: selisih Accurate − kartu | REKON MATERIAL!M31 | -1912503.24 | -1912503.24 | 0 | 1 | LULUS |
| B3.rm.31.N | Label FCC Hijau: saldo akhir implisit kartu | REKON MATERIAL!N31 | -1074398.46 | -1074398.46 | 0 | 1 | LULUS |
| B3.rm.32.H | Label FCC Putih: total kartu | REKON MATERIAL!H32 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.32.L | Label FCC Putih: pemakaian Accurate | REKON MATERIAL!L32 | 1463994.89 | 1463994.8900000001 | 1e-10 | 1 | LULUS |
| B3.rm.32.M | Label FCC Putih: selisih Accurate − kartu | REKON MATERIAL!M32 | 1463994.89 | 1463994.8900000001 | 1e-10 | 1 | LULUS |
| B3.rm.32.N | Label FCC Putih: saldo akhir implisit kartu | REKON MATERIAL!N32 | 2542694.81 | 2542694.81 | 0 | 1 | LULUS |
| B3.rm.33.H | Garam: total kartu | REKON MATERIAL!H33 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.33.L | Garam: pemakaian Accurate | REKON MATERIAL!L33 | 45149.98 | 45149.97999999998 | -2e-11 | 1 | LULUS |
| B3.rm.33.M | Garam: selisih Accurate − kartu | REKON MATERIAL!M33 | 45149.98 | 45149.97999999998 | -2e-11 | 1 | LULUS |
| B3.rm.33.N | Garam: saldo akhir implisit kartu | REKON MATERIAL!N33 | 1935000 | 1935000 | 0 | 1 | LULUS |
| B3.rm.34.H | Tepung Beras Sujiwangi: total kartu | REKON MATERIAL!H34 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.34.L | Tepung Beras Sujiwangi: pemakaian Accurate | REKON MATERIAL!L34 | 1125000 | 1125000 | 0 | 1 | LULUS |
| B3.rm.34.M | Tepung Beras Sujiwangi: selisih Accurate − kartu | REKON MATERIAL!M34 | 1125000 | 1125000 | 0 | 1 | LULUS |
| B3.rm.34.N | Tepung Beras Sujiwangi: saldo akhir implisit kartu | REKON MATERIAL!N34 | 1687500 | 1687500 | 0 | 1 | LULUS |
| B3.rm.35.H | Karton Umbis Ubi Ungu: total kartu | REKON MATERIAL!H35 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.35.L | Karton Umbis Ubi Ungu: pemakaian Accurate | REKON MATERIAL!L35 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.35.M | Karton Umbis Ubi Ungu: selisih Accurate − kartu | REKON MATERIAL!M35 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.35.N | Karton Umbis Ubi Ungu: saldo akhir implisit kartu | REKON MATERIAL!N35 | 1650780 | 1650780 | 0 | 1 | LULUS |
| B3.rm.36.H | Label WIP QKSO: total kartu | REKON MATERIAL!H36 | 98312.5 | 98312.5 | 0 | 1 | LULUS |
| B3.rm.36.L | Label WIP QKSO: pemakaian Accurate | REKON MATERIAL!L36 | 75625 | 75625 | 0 | 1 | LULUS |
| B3.rm.36.M | Label WIP QKSO: selisih Accurate − kartu | REKON MATERIAL!M36 | -22687.5 | -22687.5 | 0 | 1 | LULUS |
| B3.rm.36.N | Label WIP QKSO: saldo akhir implisit kartu | REKON MATERIAL!N36 | 960437.5 | 960437.5 | 0 | 1 | LULUS |
| B3.rm.37.H | Label WIP QKSP: total kartu | REKON MATERIAL!H37 | 18150 | 18150 | 0 | 1 | LULUS |
| B3.rm.37.L | Label WIP QKSP: pemakaian Accurate | REKON MATERIAL!L37 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.37.M | Label WIP QKSP: selisih Accurate − kartu | REKON MATERIAL!M37 | -18150 | -18150 | 0 | 1 | LULUS |
| B3.rm.37.N | Label WIP QKSP: saldo akhir implisit kartu | REKON MATERIAL!N37 | 964975 | 964975 | 0 | 1 | LULUS |
| B3.rm.38.H | Plastik PE Gusset 23*(4+4)*32*0,1: total kartu | REKON MATERIAL!H38 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.38.L | Plastik PE Gusset 23*(4+4)*32*0,1: pemakaian Accurate | REKON MATERIAL!L38 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.38.M | Plastik PE Gusset 23*(4+4)*32*0,1: selisih Accurate − kartu | REKON MATERIAL!M38 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.38.N | Plastik PE Gusset 23*(4+4)*32*0,1: saldo akhir implisit kartu | REKON MATERIAL!N38 | 955800 | 955800 | 0 | 1 | LULUS |
| B3.rm.39.H | Label FCC Biru: total kartu | REKON MATERIAL!H39 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.39.L | Label FCC Biru: pemakaian Accurate | REKON MATERIAL!L39 | 72499.39 | 72499.39000000001 | 1e-11 | 1 | LULUS |
| B3.rm.39.M | Label FCC Biru: selisih Accurate − kartu | REKON MATERIAL!M39 | 72499.39 | 72499.39000000001 | 1e-11 | 1 | LULUS |
| B3.rm.39.N | Label FCC Biru: saldo akhir implisit kartu | REKON MATERIAL!N39 | 942709.16 | 942709.16 | 0 | 1 | LULUS |
| B3.rm.40.H | Garam-KI CYCL: total kartu | REKON MATERIAL!H40 | 2493.75 | 2493.75 | 0 | 1 | LULUS |
| B3.rm.40.K | Garam-KI CYCL: saldo akhir (implisit / pembulatan) | REKON MATERIAL!K40 | 852506.25 | 852506.25 | 0 | 1 | LULUS |
| B3.rm.40.L | Garam-KI CYCL: pemakaian Accurate | REKON MATERIAL!L40 | 2493.75 | 2493.75 | 0 | 1 | LULUS |
| B3.rm.40.M | Garam-KI CYCL: selisih Accurate − kartu | REKON MATERIAL!M40 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.40.N | Garam-KI CYCL: saldo akhir implisit kartu | REKON MATERIAL!N40 | 852506.25 | 852506.25 | 0 | 1 | LULUS |
| B3.rm.41.H | Karton Maxfres: total kartu | REKON MATERIAL!H41 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.41.L | Karton Maxfres: pemakaian Accurate | REKON MATERIAL!L41 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.41.M | Karton Maxfres: selisih Accurate − kartu | REKON MATERIAL!M41 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.41.N | Karton Maxfres: saldo akhir implisit kartu | REKON MATERIAL!N41 | 792222.15 | 792222.15 | 0 | 1 | LULUS |
| B3.rm.42.H | Hot Ink Ukuran 36*40: total kartu | REKON MATERIAL!H42 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.42.L | Hot Ink Ukuran 36*40: pemakaian Accurate | REKON MATERIAL!L42 | 34200 | 34200 | 0 | 1 | LULUS |
| B3.rm.42.M | Hot Ink Ukuran 36*40: selisih Accurate − kartu | REKON MATERIAL!M42 | 34200 | 34200 | 0 | 1 | LULUS |
| B3.rm.42.N | Hot Ink Ukuran 36*40: saldo akhir implisit kartu | REKON MATERIAL!N42 | 427500 | 427500 | 0 | 1 | LULUS |
| B3.rm.43.H | Hot Ink Putih: total kartu | REKON MATERIAL!H43 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.43.L | Hot Ink Putih: pemakaian Accurate | REKON MATERIAL!L43 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.43.M | Hot Ink Putih: selisih Accurate − kartu | REKON MATERIAL!M43 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.43.N | Hot Ink Putih: saldo akhir implisit kartu | REKON MATERIAL!N43 | 264000 | 264000 | 0 | 1 | LULUS |
| B3.rm.44.H | Plastik PE Gusset 23*(4+4)*40*0,1: total kartu | REKON MATERIAL!H44 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.44.L | Plastik PE Gusset 23*(4+4)*40*0,1: pemakaian Accurate | REKON MATERIAL!L44 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.44.M | Plastik PE Gusset 23*(4+4)*40*0,1: selisih Accurate − kartu | REKON MATERIAL!M44 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.44.N | Plastik PE Gusset 23*(4+4)*40*0,1: saldo akhir implisit kartu | REKON MATERIAL!N44 | 183600 | 183600 | 0 | 1 | LULUS |
| B3.rm.45.H | Benang Merah: total kartu | REKON MATERIAL!H45 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.45.L | Benang Merah: pemakaian Accurate | REKON MATERIAL!L45 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.45.M | Benang Merah: selisih Accurate − kartu | REKON MATERIAL!M45 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.45.N | Benang Merah: saldo akhir implisit kartu | REKON MATERIAL!N45 | 177750 | 177750 | 0 | 1 | LULUS |
| B3.rm.46.H | Garam Krosok: total kartu | REKON MATERIAL!H46 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.46.L | Garam Krosok: pemakaian Accurate | REKON MATERIAL!L46 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.46.M | Garam Krosok: selisih Accurate − kartu | REKON MATERIAL!M46 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.46.N | Garam Krosok: saldo akhir implisit kartu | REKON MATERIAL!N46 | 112000 | 112000 | 0 | 1 | LULUS |
| B3.rm.47.H | Coding Tape: total kartu | REKON MATERIAL!H47 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.47.L | Coding Tape: pemakaian Accurate | REKON MATERIAL!L47 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.47.M | Coding Tape: selisih Accurate − kartu | REKON MATERIAL!M47 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.47.N | Coding Tape: saldo akhir implisit kartu | REKON MATERIAL!N47 | 34000 | 34000 | 0 | 1 | LULUS |
| B3.rm.48.H | Basreng Bumbu Level 10 Maichi: total kartu | REKON MATERIAL!H48 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.48.K | Basreng Bumbu Level 10 Maichi: saldo akhir (implisit / pembulatan) | REKON MATERIAL!K48 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.48.L | Basreng Bumbu Level 10 Maichi: pemakaian Accurate | REKON MATERIAL!L48 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.48.M | Basreng Bumbu Level 10 Maichi: selisih Accurate − kartu | REKON MATERIAL!M48 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.48.N | Basreng Bumbu Level 10 Maichi: saldo akhir implisit kartu | REKON MATERIAL!N48 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.49.H | Bumbu BBQ SSF-01110: total kartu | REKON MATERIAL!H49 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.49.K | Bumbu BBQ SSF-01110: saldo akhir (implisit / pembulatan) | REKON MATERIAL!K49 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.49.L | Bumbu BBQ SSF-01110: pemakaian Accurate | REKON MATERIAL!L49 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.49.M | Bumbu BBQ SSF-01110: selisih Accurate − kartu | REKON MATERIAL!M49 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.49.N | Bumbu BBQ SSF-01110: saldo akhir implisit kartu | REKON MATERIAL!N49 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.50.H | Bumbu Maicih Level 5: total kartu | REKON MATERIAL!H50 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.50.L | Bumbu Maicih Level 5: pemakaian Accurate | REKON MATERIAL!L50 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.50.M | Bumbu Maicih Level 5: selisih Accurate − kartu | REKON MATERIAL!M50 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.50.N | Bumbu Maicih Level 5: saldo akhir implisit kartu | REKON MATERIAL!N50 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.51.H | Polyfilm Maichi Basreng Level 5: total kartu | REKON MATERIAL!H51 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.51.K | Polyfilm Maichi Basreng Level 5: saldo akhir (implisit / pembulatan) | REKON MATERIAL!K51 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.51.L | Polyfilm Maichi Basreng Level 5: pemakaian Accurate | REKON MATERIAL!L51 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.51.M | Polyfilm Maichi Basreng Level 5: selisih Accurate − kartu | REKON MATERIAL!M51 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.51.N | Polyfilm Maichi Basreng Level 5: saldo akhir implisit kartu | REKON MATERIAL!N51 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.52.H | Basreng Bumbu Level 5 Maichi: total kartu | REKON MATERIAL!H52 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.52.L | Basreng Bumbu Level 5 Maichi: pemakaian Accurate | REKON MATERIAL!L52 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.52.M | Basreng Bumbu Level 5 Maichi: selisih Accurate − kartu | REKON MATERIAL!M52 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.52.N | Basreng Bumbu Level 5 Maichi: saldo akhir implisit kartu | REKON MATERIAL!N52 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.53.H | Polyfilm Maichi Keripik Singkong Level-5: total kartu | REKON MATERIAL!H53 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.53.L | Polyfilm Maichi Keripik Singkong Level-5: pemakaian Accurate | REKON MATERIAL!L53 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.53.M | Polyfilm Maichi Keripik Singkong Level-5: selisih Accurate − kartu | REKON MATERIAL!M53 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.53.N | Polyfilm Maichi Keripik Singkong Level-5: saldo akhir implisit kartu | REKON MATERIAL!N53 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.54.H | Bumbu Maicih Level 10: total kartu | REKON MATERIAL!H54 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.54.L | Bumbu Maicih Level 10: pemakaian Accurate | REKON MATERIAL!L54 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.54.M | Bumbu Maicih Level 10: selisih Accurate − kartu | REKON MATERIAL!M54 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.54.N | Bumbu Maicih Level 10: saldo akhir implisit kartu | REKON MATERIAL!N54 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.55.H | Polyfilm Maichi Keripik Singkong Level-3: total kartu | REKON MATERIAL!H55 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.55.L | Polyfilm Maichi Keripik Singkong Level-3: pemakaian Accurate | REKON MATERIAL!L55 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.55.M | Polyfilm Maichi Keripik Singkong Level-3: selisih Accurate − kartu | REKON MATERIAL!M55 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.55.N | Polyfilm Maichi Keripik Singkong Level-3: saldo akhir implisit kartu | REKON MATERIAL!N55 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.56.H | Bumbu Seors 132003: total kartu | REKON MATERIAL!H56 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.56.L | Bumbu Seors 132003: pemakaian Accurate | REKON MATERIAL!L56 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.56.M | Bumbu Seors 132003: selisih Accurate − kartu | REKON MATERIAL!M56 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.56.N | Bumbu Seors 132003: saldo akhir implisit kartu | REKON MATERIAL!N56 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.57.H | Bumbu Maicih Level 3: total kartu | REKON MATERIAL!H57 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.57.L | Bumbu Maicih Level 3: pemakaian Accurate | REKON MATERIAL!L57 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.57.M | Bumbu Maicih Level 3: selisih Accurate − kartu | REKON MATERIAL!M57 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.57.N | Bumbu Maicih Level 3: saldo akhir implisit kartu | REKON MATERIAL!N57 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.58.H | Polyfilm Maichi Basreng Level 10: total kartu | REKON MATERIAL!H58 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.58.L | Polyfilm Maichi Basreng Level 10: pemakaian Accurate | REKON MATERIAL!L58 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.58.M | Polyfilm Maichi Basreng Level 10: selisih Accurate − kartu | REKON MATERIAL!M58 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.58.N | Polyfilm Maichi Basreng Level 10: saldo akhir implisit kartu | REKON MATERIAL!N58 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.59.H | Karton Maicih: total kartu | REKON MATERIAL!H59 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.59.L | Karton Maicih: pemakaian Accurate | REKON MATERIAL!L59 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.59.M | Karton Maicih: selisih Accurate − kartu | REKON MATERIAL!M59 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.59.N | Karton Maicih: saldo akhir implisit kartu | REKON MATERIAL!N59 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.60.H | Polyfilm Maichi Keripik Singkong Level-10: total kartu | REKON MATERIAL!H60 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.60.L | Polyfilm Maichi Keripik Singkong Level-10: pemakaian Accurate | REKON MATERIAL!L60 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.60.M | Polyfilm Maichi Keripik Singkong Level-10: selisih Accurate − kartu | REKON MATERIAL!M60 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.60.N | Polyfilm Maichi Keripik Singkong Level-10: saldo akhir implisit kartu | REKON MATERIAL!N60 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.61.H | Pembulatan Inventory Valuation vs GL 1106-001: total kartu | REKON MATERIAL!H61 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.61.K | Pembulatan Inventory Valuation vs GL 1106-001: saldo akhir (implisit / pembulatan) | REKON MATERIAL!K61 | 3187.94 | 3187.940000295639 | 2.95639e-7 | 1 | LULUS |
| B3.rm.61.L | Pembulatan Inventory Valuation vs GL 1106-001: pemakaian Accurate | REKON MATERIAL!L61 | -3187.94 | -3187.940000295639 | -2.95639e-7 | 1 | LULUS |
| B3.rm.61.M | Pembulatan Inventory Valuation vs GL 1106-001: selisih Accurate − kartu | REKON MATERIAL!M61 | -3187.94 | -3187.940000295639 | -2.95639e-7 | 1 | LULUS |
| B3.rm.61.N | Pembulatan Inventory Valuation vs GL 1106-001: saldo akhir implisit kartu | REKON MATERIAL!N61 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.total.D | REKON MATERIAL total D | REKON MATERIAL!D62 | 4233644581.45 | 4233644581.45 | 0 | 1 | LULUS |
| B3.rm.total.E | REKON MATERIAL total E | REKON MATERIAL!E62 | 12447449.37 | 12447449.37 | 0 | 1 | LULUS |
| B3.rm.total.F | REKON MATERIAL total F | REKON MATERIAL!F62 | 173600702.18 | 173600702.18 | 0 | 1 | LULUS |
| B3.rm.total.G | REKON MATERIAL total G | REKON MATERIAL!G62 | 76673618.51 | 76673618.50999999 | -1e-8 | 1 | LULUS |
| B3.rm.total.H | REKON MATERIAL total H | REKON MATERIAL!H62 | 4496366351.51 | 4496366351.509997 | -0.000003 | 1 | LULUS |
| B3.rm.total.I | REKON MATERIAL total I | REKON MATERIAL!I62 | 739007248.33 | 739007248.33 | 0 | 1 | LULUS |
| B3.rm.total.J | REKON MATERIAL total J | REKON MATERIAL!J62 | 4583390378.8 | 4583390378.8 | 0 | 1 | LULUS |
| B3.rm.total.K | REKON MATERIAL total K | REKON MATERIAL!K62 | 947179465.89 | 947179465.89 | 0 | 1 | LULUS |
| B3.rm.total.L | REKON MATERIAL total L | REKON MATERIAL!L62 | 4375218161.24 | 4375218161.240002 | 0.000002 | 1 | LULUS |
| B3.rm.total.M | REKON MATERIAL total M | REKON MATERIAL!M62 | -121148190.27 | -121148190.27000037 | -3.7e-7 | 1 | LULUS |
| B3.rm.total.N | REKON MATERIAL total N | REKON MATERIAL!N62 | 826031275.62 | 826031275.6199996 | -4e-7 | 1 | LULUS |
| B3.rm.gl_close | Saldo akhir 1106-001 GL | REKON MATERIAL!C70 | 947179458.69 | 947179458.6900005 | 5e-7 | 1 | LULUS |
| B3.rm.gl_lk.receipts | Penerimaan GL − LK | REKON MATERIAL!F68 | 0.01 | 0.010000228881835938 | 2.28882e-7 | 1 | LULUS |
| B3.rm.gl_lk.usage | Pemakaian GL − LK | REKON MATERIAL!F69 | 7.21 | 7.210000038146973 | 3.8147e-8 | 1 | LULUS |
| B3.rm.gl_lk.close | Saldo akhir GL − LK | REKON MATERIAL!F70 | -7.2 | -7.199999451637268 | 5.48363e-7 | 1 | LULUS |
| B3.rm.check.card_fcc | Kartu FCC per item = material FCC di WP | REKON MATERIAL!C75 | -0.0094436 | -0.00944375991821289 | -1.59918e-7 | 1 | LULUS |
| B3.rm.check.card_uu | Kartu UU per item = material UU di WP | REKON MATERIAL!C76 | 0.006736322 | 0.006736321374773979 | -6.25226e-10 | 1 | LULUS |
| B3.rm.check.card_uo | Kartu UO per item = material UO di WP | REKON MATERIAL!C77 | -0.01353086 | -0.013530850410461426 | 9.58954e-9 | 1 | LULUS |
| B3.rm.check.card_lain | Kartu Lain-lain per item = material Lain-lain di WP | REKON MATERIAL!C78 | -0.0084395405 | -0.008439555764198303 | -1.52642e-8 | 1 | LULUS |
| B3.rm.check.open_vs_gl | Saldo awal per item = saldo awal GL | REKON MATERIAL!C79 | -0.01 | -0.009999990463256836 | 9.53674e-9 | 1 | LULUS |
| B3.rm.check.in_vs_gl | Penerimaan per item = penerimaan GL | REKON MATERIAL!C80 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.check.close_vs_lk | Saldo akhir per item = saldo akhir LK | REKON MATERIAL!C81 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.check.rounding_small | Pembulatan Inventory Valuation vs GL ≤ Rp 10.000 | REKON MATERIAL!C82 | 0 | 0 | 0 | 1 | LULUS |
| B3.rm.check.receipts_gl_lk | Penerimaan GL = LK | REKON MATERIAL!C83 | 0.01 | 0.010000228881835938 | 2.28882e-7 | 1 | LULUS |
| B3.rm.check.usage_gl_lk | Pemakaian GL = LK | REKON MATERIAL!C84 | 7.21 | 7.210000038146973 | 3.8147e-8 | 1 | LULUS |
| B3.rm.check.close_gl_lk | Saldo akhir GL = LK | REKON MATERIAL!C85 | -7.2 | -7.199999451637268 | 5.48363e-7 | 1 | LULUS |
| B3.rm.check.usage_vs_recon | Pemakaian Accurate (total) = pemakaian GL di rekonsiliasi HPP | REKON MATERIAL!C86 | 0.00423 | 0.004231452941894531 | 0.00000145294 | 1 | LULUS |
| B3.rm.check.diff_vs_variance | Selisih Accurate − kartu (total) = varian material | REKON MATERIAL!C87 | 0.0289076785 | 0.028907686471939087 | 7.97194e-9 | 1 | LULUS |
| B3.rp.gl.wipOpen | REKON PERSEDIAAN gl wipOpen | REKON PERSEDIAAN!C7 | 494002773.03 | 494002773.03 | 0 | 1 | LULUS |
| B3.rp.gl.wipClose | REKON PERSEDIAAN gl wipClose | REKON PERSEDIAAN!D7 | 297850706.22 | 297850706.22 | 0 | 1 | LULUS |
| B3.rp.gl.wipDelta | REKON PERSEDIAAN gl wipDelta | REKON PERSEDIAAN!E7 | -196152066.81 | -196152066.80999994 | 6e-8 | 1 | LULUS |
| B3.rp.gl.fgOpen | REKON PERSEDIAAN gl fgOpen | REKON PERSEDIAAN!F7 | 499690063.73 | 499690063.73 | 0 | 1 | LULUS |
| B3.rp.gl.fgClose | REKON PERSEDIAAN gl fgClose | REKON PERSEDIAAN!G7 | 286536639.64 | 286536639.64 | 0 | 1 | LULUS |
| B3.rp.gl.fgDelta | REKON PERSEDIAAN gl fgDelta | REKON PERSEDIAAN!H7 | -213153424.09 | -213153424.09000003 | -3e-8 | 1 | LULUS |
| B3.rp.iv.wipOpen | REKON PERSEDIAAN iv wipOpen | REKON PERSEDIAAN!C8 | 494002760.11 | 494002760.1099999 | -1e-7 | 1 | LULUS |
| B3.rp.iv.wipClose | REKON PERSEDIAAN iv wipClose | REKON PERSEDIAAN!D8 | 297850682.61 | 297850682.6099998 | -2e-7 | 1 | LULUS |
| B3.rp.iv.wipDelta | REKON PERSEDIAAN iv wipDelta | REKON PERSEDIAAN!E8 | -196152077.5 | -196152077.50000012 | -1.2e-7 | 1 | LULUS |
| B3.rp.iv.fgOpen | REKON PERSEDIAAN iv fgOpen | REKON PERSEDIAAN!F8 | 500407878.87 | 500407878.86999995 | -5e-8 | 1 | LULUS |
| B3.rp.iv.fgClose | REKON PERSEDIAAN iv fgClose | REKON PERSEDIAAN!G8 | 287254450.81 | 287254450.80999994 | -6e-8 | 1 | LULUS |
| B3.rp.iv.fgDelta | REKON PERSEDIAAN iv fgDelta | REKON PERSEDIAAN!H8 | -213153428.06 | -213153428.06 | 0 | 1 | LULUS |
| B3.rp.subledgerGap.wipOpen | REKON PERSEDIAAN subledgerGap wipOpen | REKON PERSEDIAAN!C9 | 12.92 | 12.920000076293945 | 7.62939e-8 | 1 | LULUS |
| B3.rp.subledgerGap.wipClose | REKON PERSEDIAAN subledgerGap wipClose | REKON PERSEDIAAN!D9 | 23.61 | 23.610000252723694 | 2.52724e-7 | 1 | LULUS |
| B3.rp.subledgerGap.wipDelta | REKON PERSEDIAAN subledgerGap wipDelta | REKON PERSEDIAAN!E9 | 10.69 | 10.690000176429749 | 1.7643e-7 | 1 | LULUS |
| B3.rp.subledgerGap.fgOpen | REKON PERSEDIAAN subledgerGap fgOpen | REKON PERSEDIAAN!F9 | -717815.14 | -717815.1399999261 | 7.39e-8 | 1 | LULUS |
| B3.rp.subledgerGap.fgClose | REKON PERSEDIAAN subledgerGap fgClose | REKON PERSEDIAAN!G9 | -717811.17 | -717811.1699999571 | 4.29e-8 | 1 | LULUS |
| B3.rp.subledgerGap.fgDelta | REKON PERSEDIAAN subledgerGap fgDelta | REKON PERSEDIAAN!H9 | 3.97 | 3.9699999690055847 | -3.09944e-8 | 1 | LULUS |
| B3.rp.wp.wipOpen | REKON PERSEDIAAN wp wipOpen | REKON PERSEDIAAN!C10 | 148536517.82159864 | 148536517.82159862 | -2e-8 | 1 | LULUS |
| B3.rp.wp.wipClose | REKON PERSEDIAAN wp wipClose | REKON PERSEDIAAN!D10 | 51984599.28324415 | 51984599.28324415 | 0 | 1 | LULUS |
| B3.rp.wp.wipDelta | REKON PERSEDIAAN wp wipDelta | REKON PERSEDIAAN!E10 | -96551918.53835449 | -96551918.53835447 | 2e-8 | 1 | LULUS |
| B3.rp.wp.fgOpen | REKON PERSEDIAAN wp fgOpen | REKON PERSEDIAAN!F10 | 244158806.427480402 | 244158806.4274804 | -2e-9 | 1 | LULUS |
| B3.rp.wp.fgClose | REKON PERSEDIAAN wp fgClose | REKON PERSEDIAAN!G10 | 14171280.852956014 | 14171280.852956014 | 0 | 1 | LULUS |
| B3.rp.wp.fgDelta | REKON PERSEDIAAN wp fgDelta | REKON PERSEDIAAN!H10 | -229987525.574524388 | -229987525.57452437 | 1.8e-8 | 1 | LULUS |
| B3.rp.wpMinusGl.wipOpen | REKON PERSEDIAAN wpMinusGl wipOpen | REKON PERSEDIAAN!C11 | -345466255.20840136 | -345466255.2084013 | 6e-8 | 1 | LULUS |
| B3.rp.wpMinusGl.wipClose | REKON PERSEDIAAN wpMinusGl wipClose | REKON PERSEDIAAN!D11 | -245866106.93675585 | -245866106.9367559 | -5e-8 | 1 | LULUS |
| B3.rp.wpMinusGl.wipDelta | REKON PERSEDIAAN wpMinusGl wipDelta | REKON PERSEDIAAN!E11 | 99600148.27164551 | 99600148.27164543 | -8e-8 | 1 | LULUS |
| B3.rp.wpMinusGl.fgOpen | REKON PERSEDIAAN wpMinusGl fgOpen | REKON PERSEDIAAN!F11 | -255531257.302519598 | -255531257.30251962 | -2.2e-8 | 1 | LULUS |
| B3.rp.wpMinusGl.fgClose | REKON PERSEDIAAN wpMinusGl fgClose | REKON PERSEDIAAN!G11 | -272365358.787043986 | -272365358.787044 | -1.4e-8 | 1 | LULUS |
| B3.rp.wpMinusGl.fgDelta | REKON PERSEDIAAN wpMinusGl fgDelta | REKON PERSEDIAAN!H11 | -16834101.484524388 | -16834101.48452437 | 1.8e-8 | 1 | LULUS |
| B3.rp.k1.wipOpen | REKON PERSEDIAAN k1 wipOpen | REKON PERSEDIAAN!C13 | 15383217.63159864 | 15383217.631598622 | -1.8e-8 | 1 | LULUS |
| B3.rp.k1.wipClose | REKON PERSEDIAAN k1 wipClose | REKON PERSEDIAAN!D13 | 5303487.77324415 | 5303487.77324415 | 0 | 1 | LULUS |
| B3.rp.k1.wipDelta | REKON PERSEDIAAN k1 wipDelta | REKON PERSEDIAAN!E13 | -10079729.85835449 | -10079729.858354472 | 1.8e-8 | 1 | LULUS |
| B3.rp.k1.fgOpen | REKON PERSEDIAAN k1 fgOpen | REKON PERSEDIAAN!F13 | 19743260.2674804 | 19743260.267480373 | -2.7e-8 | 1 | LULUS |
| B3.rp.k1.fgClose | REKON PERSEDIAAN k1 fgClose | REKON PERSEDIAAN!G13 | 2505423.102956013 | 2505423.1029560138 | 8e-10 | 1 | LULUS |
| B3.rp.k1.fgDelta | REKON PERSEDIAAN k1 fgDelta | REKON PERSEDIAAN!H13 | -17237837.164524387 | -17237837.16452436 | 2.7e-8 | 1 | LULUS |
| B3.rp.k1QtyDiff.wipOpen | REKON PERSEDIAAN k1QtyDiff wipOpen | REKON PERSEDIAAN!C14 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k1QtyDiff.wipClose | REKON PERSEDIAAN k1QtyDiff wipClose | REKON PERSEDIAAN!D14 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k1QtyDiff.wipDelta | REKON PERSEDIAAN k1QtyDiff wipDelta | REKON PERSEDIAAN!E14 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k1QtyDiff.fgOpen | REKON PERSEDIAAN k1QtyDiff fgOpen | REKON PERSEDIAAN!F14 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k1QtyDiff.fgClose | REKON PERSEDIAAN k1QtyDiff fgClose | REKON PERSEDIAAN!G14 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k1QtyDiff.fgDelta | REKON PERSEDIAAN k1QtyDiff fgDelta | REKON PERSEDIAAN!H14 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k1ResidualNoQty.wipOpen | REKON PERSEDIAAN k1ResidualNoQty wipOpen | REKON PERSEDIAAN!C15 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k1ResidualNoQty.wipClose | REKON PERSEDIAAN k1ResidualNoQty wipClose | REKON PERSEDIAAN!D15 | -0.12 | -0.12 | 0 | 1 | LULUS |
| B3.rp.k1ResidualNoQty.wipDelta | REKON PERSEDIAAN k1ResidualNoQty wipDelta | REKON PERSEDIAAN!E15 | -0.12 | -0.12 | 0 | 1 | LULUS |
| B3.rp.k1ResidualNoQty.fgOpen | REKON PERSEDIAAN k1ResidualNoQty fgOpen | REKON PERSEDIAAN!F15 | 974522.72 | 974522.7200000001 | 1e-10 | 1 | LULUS |
| B3.rp.k1ResidualNoQty.fgClose | REKON PERSEDIAAN k1ResidualNoQty fgClose | REKON PERSEDIAAN!G15 | -717806.68 | -717806.6799999999 | 1e-10 | 1 | LULUS |
| B3.rp.k1ResidualNoQty.fgDelta | REKON PERSEDIAAN k1ResidualNoQty fgDelta | REKON PERSEDIAAN!H15 | -1692329.4 | -1692329.4 | 0 | 1 | LULUS |
| B3.rp.k1Rate.wipOpen | REKON PERSEDIAAN k1Rate wipOpen | REKON PERSEDIAAN!C16 | 15383217.63159864 | 15383217.631598622 | -1.8e-8 | 1 | LULUS |
| B3.rp.k1Rate.wipClose | REKON PERSEDIAAN k1Rate wipClose | REKON PERSEDIAAN!D16 | 5303487.89324415 | 5303487.89324415 | 0 | 1 | LULUS |
| B3.rp.k1Rate.wipDelta | REKON PERSEDIAAN k1Rate wipDelta | REKON PERSEDIAAN!E16 | -10079729.73835449 | -10079729.73835447 | 2e-8 | 1 | LULUS |
| B3.rp.k1Rate.fgOpen | REKON PERSEDIAAN k1Rate fgOpen | REKON PERSEDIAAN!F16 | 18768737.5474804 | 18768737.547480375 | -2.5e-8 | 1 | LULUS |
| B3.rp.k1Rate.fgClose | REKON PERSEDIAAN k1Rate fgClose | REKON PERSEDIAAN!G16 | 3223229.782956013 | 3223229.7829560135 | 5e-10 | 1 | LULUS |
| B3.rp.k1Rate.fgDelta | REKON PERSEDIAAN k1Rate fgDelta | REKON PERSEDIAAN!H16 | -15545507.764524387 | -15545507.764524361 | 2.6e-8 | 1 | LULUS |
| B3.rp.k2.wipOpen | REKON PERSEDIAAN k2 wipOpen | REKON PERSEDIAAN!C17 | -317108830.29 | -317108830.29 | 0 | 1 | LULUS |
| B3.rp.k2.wipClose | REKON PERSEDIAAN k2 wipClose | REKON PERSEDIAAN!D17 | -225691966.25 | -225691966.25 | 0 | 1 | LULUS |
| B3.rp.k2.wipDelta | REKON PERSEDIAAN k2 wipDelta | REKON PERSEDIAAN!E17 | 91416864.04 | 91416864.04000002 | 2e-8 | 1 | LULUS |
| B3.rp.k2.fgOpen | REKON PERSEDIAAN k2 fgOpen | REKON PERSEDIAAN!F17 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k2.fgClose | REKON PERSEDIAAN k2 fgClose | REKON PERSEDIAAN!G17 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k2.fgDelta | REKON PERSEDIAAN k2 fgDelta | REKON PERSEDIAAN!H17 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k3.wipOpen | REKON PERSEDIAAN k3 wipOpen | REKON PERSEDIAAN!C18 | -43740629.63 | -43740629.63000002 | -2e-8 | 1 | LULUS |
| B3.rp.k3.wipClose | REKON PERSEDIAAN k3 wipClose | REKON PERSEDIAAN!D18 | -25477604.85 | -25477604.849999994 | 6e-9 | 1 | LULUS |
| B3.rp.k3.wipDelta | REKON PERSEDIAAN k3 wipDelta | REKON PERSEDIAAN!E18 | 18263024.78 | 18263024.780000024 | 2.4e-8 | 1 | LULUS |
| B3.rp.k3.fgOpen | REKON PERSEDIAAN k3 fgOpen | REKON PERSEDIAAN!F18 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k3.fgClose | REKON PERSEDIAAN k3 fgClose | REKON PERSEDIAAN!G18 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k3.fgDelta | REKON PERSEDIAAN k3 fgDelta | REKON PERSEDIAAN!H18 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k4.wipOpen | REKON PERSEDIAAN k4 wipOpen | REKON PERSEDIAAN!C19 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k4.wipClose | REKON PERSEDIAAN k4 wipClose | REKON PERSEDIAAN!D19 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k4.wipDelta | REKON PERSEDIAAN k4 wipDelta | REKON PERSEDIAAN!E19 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k4.fgOpen | REKON PERSEDIAAN k4 fgOpen | REKON PERSEDIAAN!F19 | -273297125.52 | -273297125.52 | 0 | 1 | LULUS |
| B3.rp.k4.fgClose | REKON PERSEDIAAN k4 fgClose | REKON PERSEDIAAN!G19 | -273056731.75 | -273056731.75 | 0 | 1 | LULUS |
| B3.rp.k4.fgDelta | REKON PERSEDIAAN k4 fgDelta | REKON PERSEDIAAN!H19 | 240393.77 | 240393.76999998093 | -1.907e-8 | 1 | LULUS |
| B3.rp.k5.wipOpen | REKON PERSEDIAAN k5 wipOpen | REKON PERSEDIAAN!C20 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k5.wipClose | REKON PERSEDIAAN k5 wipClose | REKON PERSEDIAAN!D20 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k5.wipDelta | REKON PERSEDIAAN k5 wipDelta | REKON PERSEDIAAN!E20 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k5.fgOpen | REKON PERSEDIAAN k5 fgOpen | REKON PERSEDIAAN!F20 | -2695207.19 | -2695207.19 | 0 | 1 | LULUS |
| B3.rp.k5.fgClose | REKON PERSEDIAAN k5 fgClose | REKON PERSEDIAAN!G20 | -2531861.31 | -2531861.3099999996 | 4e-10 | 1 | LULUS |
| B3.rp.k5.fgDelta | REKON PERSEDIAAN k5 fgDelta | REKON PERSEDIAAN!H20 | 163345.88 | 163345.88000000035 | 3.5e-10 | 1 | LULUS |
| B3.rp.k6.wipOpen | REKON PERSEDIAAN k6 wipOpen | REKON PERSEDIAAN!C21 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k6.wipClose | REKON PERSEDIAAN k6 wipClose | REKON PERSEDIAAN!D21 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k6.wipDelta | REKON PERSEDIAAN k6 wipDelta | REKON PERSEDIAAN!E21 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k6.fgOpen | REKON PERSEDIAAN k6 fgOpen | REKON PERSEDIAAN!F21 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k6.fgClose | REKON PERSEDIAAN k6 fgClose | REKON PERSEDIAAN!G21 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.k6.fgDelta | REKON PERSEDIAAN k6 fgDelta | REKON PERSEDIAAN!H21 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.subledgerReversal.wipOpen | REKON PERSEDIAAN subledgerReversal wipOpen | REKON PERSEDIAAN!C22 | -12.92 | -12.920000076293945 | -7.62939e-8 | 1 | LULUS |
| B3.rp.subledgerReversal.wipClose | REKON PERSEDIAAN subledgerReversal wipClose | REKON PERSEDIAAN!D22 | -23.61 | -23.610000252723694 | -2.52724e-7 | 1 | LULUS |
| B3.rp.subledgerReversal.wipDelta | REKON PERSEDIAAN subledgerReversal wipDelta | REKON PERSEDIAAN!E22 | -10.69 | -10.690000176429749 | -1.7643e-7 | 1 | LULUS |
| B3.rp.subledgerReversal.fgOpen | REKON PERSEDIAAN subledgerReversal fgOpen | REKON PERSEDIAAN!F22 | 717815.14 | 717815.1399999261 | -7.39e-8 | 1 | LULUS |
| B3.rp.subledgerReversal.fgClose | REKON PERSEDIAAN subledgerReversal fgClose | REKON PERSEDIAAN!G22 | 717811.17 | 717811.1699999571 | -4.29e-8 | 1 | LULUS |
| B3.rp.subledgerReversal.fgDelta | REKON PERSEDIAAN subledgerReversal fgDelta | REKON PERSEDIAAN!H22 | -3.97 | -3.9699999690055847 | 3.09944e-8 | 1 | LULUS |
| B3.rp.explained.wipOpen | REKON PERSEDIAAN explained wipOpen | REKON PERSEDIAAN!C23 | -345466255.20840136 | -345466255.20840144 | -8e-8 | 1 | LULUS |
| B3.rp.explained.wipClose | REKON PERSEDIAAN explained wipClose | REKON PERSEDIAAN!D23 | -245866106.93675585 | -245866106.9367561 | -2.5e-7 | 1 | LULUS |
| B3.rp.explained.wipDelta | REKON PERSEDIAAN explained wipDelta | REKON PERSEDIAAN!E23 | 99600148.27164551 | 99600148.27164534 | -1.7e-7 | 1 | LULUS |
| B3.rp.explained.fgOpen | REKON PERSEDIAAN explained fgOpen | REKON PERSEDIAAN!F23 | -255531257.3025196 | -255531257.30251968 | -8e-8 | 1 | LULUS |
| B3.rp.explained.fgClose | REKON PERSEDIAAN explained fgClose | REKON PERSEDIAAN!G23 | -272365358.787043987 | -272365358.78704405 | -6.3e-8 | 1 | LULUS |
| B3.rp.explained.fgDelta | REKON PERSEDIAAN explained fgDelta | REKON PERSEDIAAN!H23 | -16834101.484524387 | -16834101.48452437 | 1.7e-8 | 1 | LULUS |
| B3.rp.residual.wipOpen | REKON PERSEDIAAN residual wipOpen | REKON PERSEDIAAN!C24 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.residual.wipClose | REKON PERSEDIAAN residual wipClose | REKON PERSEDIAAN!D24 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.residual.wipDelta | REKON PERSEDIAAN residual wipDelta | REKON PERSEDIAAN!E24 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.residual.fgOpen | REKON PERSEDIAAN residual fgOpen | REKON PERSEDIAAN!F24 | 0.000000002 | 0 | -2e-9 | 1 | LULUS |
| B3.rp.residual.fgClose | REKON PERSEDIAAN residual fgClose | REKON PERSEDIAAN!G24 | 0.000000001 | 0 | -1e-9 | 1 | LULUS |
| B3.rp.residual.fgDelta | REKON PERSEDIAAN residual fgDelta | REKON PERSEDIAAN!H24 | -0.000000001 | 0 | 1e-9 | 1 | LULUS |
| B3.rp.delta_sum | Σ Δ (WP − GL) WIP + FG | REKON PERSEDIAAN!E25 | 82766046.787121122 | 82766046.78712106 | -6.2e-8 | 1 | LULUS |
| B3.rp.check.C30 | Beda subledger vs GL WIP stabil | REKON PERSEDIAAN!C30 | 10.69 | 10.690000176429749 | 1.7643e-7 | 1 | LULUS |
| B3.rp.check.C31 | Beda subledger vs GL barang jadi stabil | REKON PERSEDIAAN!C31 | 3.97 | 3.9699999690055847 | -3.09944e-8 | 1 | LULUS |
| B3.rp.check.C32 | Σ WP K1 WIP akhir − saldo WP | REKON PERSEDIAAN!C32 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.check.C33 | Σ WP K1 barang jadi akhir − saldo WP | REKON PERSEDIAAN!C33 | -0.000000001 | 0 | 1e-9 | 1 | LULUS |
| B3.rp.check.C34 | Σ WP K1 WIP awal − saldo WP | REKON PERSEDIAAN!C34 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.check.C35 | Σ WP K1 barang jadi awal − saldo WP | REKON PERSEDIAAN!C35 | -0.000000002 | 0 | 2e-9 | 1 | LULUS |
| B3.rp.check.C36 | Sisa WIP akhir | REKON PERSEDIAAN!C36 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.check.C37 | Sisa barang jadi akhir | REKON PERSEDIAAN!C37 | 0.000000001 | 0 | -1e-9 | 1 | LULUS |
| B3.rp.check.C38 | Σ Δ (WP − GL) − selisih kenaikan persediaan rekonsiliasi HPP | REKON PERSEDIAAN!C38 | -0.000001 | -0.0000009834766387939453 | 1.65234e-8 | 1 | LULUS |
| B3.rp.check.C39 | Item belum terklasifikasi | REKON PERSEDIAAN!C39 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.check.C41 | Uji kartu lama: item di atas batas | REKON PERSEDIAAN!C41 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-067.N | WIP-067 kolom N | REKON PERSEDIAAN!N55 | 5303487.89324415 | 5303487.893244147 | -3e-9 | 1 | LULUS |
| B3.rp.item.WIP-067.O | WIP-067 kolom O | REKON PERSEDIAAN!O55 | 4797576.97688351 | 4797576.976883506 | -4e-9 | 1 | LULUS |
| B3.rp.item.WIP-067.P | WIP-067 kolom P | REKON PERSEDIAAN!P55 | 21487.27797008055235903337169159953970081 | 21487.27797008055 | -2.35903e-12 | 0.0001 | LULUS |
| B3.rp.item.WIP-067.Q | WIP-067 kolom Q | REKON PERSEDIAAN!Q55 | 23928.46917525622554660529344073647871116 | 23928.469175256225 | -5.46605e-13 | 0.0001 | LULUS |
| B3.rp.item.WIP-067.S | WIP-067 kolom S | REKON PERSEDIAAN!S55 | -0.0001175374474713110158732258459911931716 | -0.00011753744747133865 | -2.76341e-17 | 0.0001 | LULUS |
| B3.rp.item.WIP-067.U | WIP-067 kolom U | REKON PERSEDIAAN!U55 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-067.V | WIP-067 kolom V | REKON PERSEDIAAN!V55 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-138.N | WIP-138 kolom N | REKON PERSEDIAAN!N56 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-138.O | WIP-138 kolom O | REKON PERSEDIAAN!O56 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-138.P | WIP-138 kolom P | REKON PERSEDIAAN!P56 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-138.Q | WIP-138 kolom Q | REKON PERSEDIAAN!Q56 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-138.S | WIP-138 kolom S | REKON PERSEDIAAN!S56 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-138.U | WIP-138 kolom U | REKON PERSEDIAAN!U56 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-138.V | WIP-138 kolom V | REKON PERSEDIAAN!V56 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-139.N | WIP-139 kolom N | REKON PERSEDIAAN!N57 | -0.12 | -0.12 | 0 | 1 | LULUS |
| B3.rp.item.WIP-139.O | WIP-139 kolom O | REKON PERSEDIAAN!O57 | -14877306.835238 | -14877306.83523799 | 1e-8 | 1 | LULUS |
| B3.rp.item.WIP-139.P | WIP-139 kolom P | REKON PERSEDIAAN!P57 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-139.Q | WIP-139 kolom Q | REKON PERSEDIAAN!Q57 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-139.S | WIP-139 kolom S | REKON PERSEDIAAN!S57 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-139.U | WIP-139 kolom U | REKON PERSEDIAAN!U57 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-139.V | WIP-139 kolom V | REKON PERSEDIAAN!V57 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-022.N | WIP-022 kolom N | REKON PERSEDIAAN!N58 | -225691966.25 | -225691966.25 | 0 | 1 | LULUS |
| B3.rp.item.WIP-022.O | WIP-022 kolom O | REKON PERSEDIAAN!O58 | 91416864.04 | 91416864.04000002 | 2e-8 | 1 | LULUS |
| B3.rp.item.WIP-022.P | WIP-022 kolom P | REKON PERSEDIAAN!P58 | 17448.16128720525705450328565906455353692 | 17448.161287205257 | -5.45033e-14 | 0.0001 | LULUS |
| B3.rp.item.WIP-022.Q | WIP-022 kolom Q | REKON PERSEDIAAN!Q58 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-022.S | WIP-022 kolom S | REKON PERSEDIAAN!S58 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-022.U | WIP-022 kolom U | REKON PERSEDIAAN!U58 | -225691966.25 | -225691966.25 | 0 | 1 | LULUS |
| B3.rp.item.WIP-022.V | WIP-022 kolom V | REKON PERSEDIAAN!V58 | -317108830.29 | -317108830.29 | 0 | 1 | LULUS |
| B3.rp.item.WIP-005.N | WIP-005 kolom N | REKON PERSEDIAAN!N59 | -2928343.71 | -2928343.71 | 0 | 1 | LULUS |
| B3.rp.item.WIP-005.O | WIP-005 kolom O | REKON PERSEDIAAN!O59 | -1487601.06 | -1487601.06 | 0 | 1 | LULUS |
| B3.rp.item.WIP-005.P | WIP-005 kolom P | REKON PERSEDIAAN!P59 | 32902.73831460674157303370786516853932584 | 32902.738314606744 | 2.42697e-12 | 0.0001 | LULUS |
| B3.rp.item.WIP-005.Q | WIP-005 kolom Q | REKON PERSEDIAAN!Q59 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-005.S | WIP-005 kolom S | REKON PERSEDIAAN!S59 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-005.U | WIP-005 kolom U | REKON PERSEDIAAN!U59 | -2928343.71 | -2928343.71 | 0 | 1 | LULUS |
| B3.rp.item.WIP-005.V | WIP-005 kolom V | REKON PERSEDIAAN!V59 | -1440742.65 | -1440742.65 | 0 | 1 | LULUS |
| B3.rp.item.WIP-007.N | WIP-007 kolom N | REKON PERSEDIAAN!N60 | -55292.39 | -55292.39 | 0 | 1 | LULUS |
| B3.rp.item.WIP-007.O | WIP-007 kolom O | REKON PERSEDIAAN!O60 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-007.P | WIP-007 kolom P | REKON PERSEDIAAN!P60 | 9873.641071428571428571428571428571428571 | 9873.641071428572 | 5.71429e-13 | 0.0001 | LULUS |
| B3.rp.item.WIP-007.Q | WIP-007 kolom Q | REKON PERSEDIAAN!Q60 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-007.S | WIP-007 kolom S | REKON PERSEDIAAN!S60 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-007.U | WIP-007 kolom U | REKON PERSEDIAAN!U60 | -55292.39 | -55292.39 | 0 | 1 | LULUS |
| B3.rp.item.WIP-007.V | WIP-007 kolom V | REKON PERSEDIAAN!V60 | -55292.39 | -55292.39 | 0 | 1 | LULUS |
| B3.rp.item.WIP-013.N | WIP-013 kolom N | REKON PERSEDIAAN!N61 | -42791.58 | -42791.58 | 0 | 1 | LULUS |
| B3.rp.item.WIP-013.O | WIP-013 kolom O | REKON PERSEDIAAN!O61 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-013.P | WIP-013 kolom P | REKON PERSEDIAAN!P61 | 1945.071818181818181818181818181818181818 | 1945.0718181818183 | 1.18182e-13 | 0.0001 | LULUS |
| B3.rp.item.WIP-013.Q | WIP-013 kolom Q | REKON PERSEDIAAN!Q61 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-013.S | WIP-013 kolom S | REKON PERSEDIAAN!S61 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-013.U | WIP-013 kolom U | REKON PERSEDIAAN!U61 | -42791.58 | -42791.58 | 0 | 1 | LULUS |
| B3.rp.item.WIP-013.V | WIP-013 kolom V | REKON PERSEDIAAN!V61 | -42791.58 | -42791.58 | 0 | 1 | LULUS |
| B3.rp.item.WIP-016.N | WIP-016 kolom N | REKON PERSEDIAAN!N62 | -406071.73 | -406071.73 | 0 | 1 | LULUS |
| B3.rp.item.WIP-016.O | WIP-016 kolom O | REKON PERSEDIAAN!O62 | -345800.36 | -345800.36 | 0 | 1 | LULUS |
| B3.rp.item.WIP-016.P | WIP-016 kolom P | REKON PERSEDIAAN!P62 | 5639.885138888888888888888888888888888889 | 5639.885138888889 | 1.11111e-13 | 0.0001 | LULUS |
| B3.rp.item.WIP-016.Q | WIP-016 kolom Q | REKON PERSEDIAAN!Q62 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-016.S | WIP-016 kolom S | REKON PERSEDIAAN!S62 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-016.U | WIP-016 kolom U | REKON PERSEDIAAN!U62 | -406071.73 | -406071.73 | 0 | 1 | LULUS |
| B3.rp.item.WIP-016.V | WIP-016 kolom V | REKON PERSEDIAAN!V62 | -60271.37 | -60271.37 | 0 | 1 | LULUS |
| B3.rp.item.WIP-018.N | WIP-018 kolom N | REKON PERSEDIAAN!N63 | -17218.94 | -17218.94 | 0 | 1 | LULUS |
| B3.rp.item.WIP-018.O | WIP-018 kolom O | REKON PERSEDIAAN!O63 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-018.P | WIP-018 kolom P | REKON PERSEDIAAN!P63 | 344378.8 | 344378.79999999993 | -7e-11 | 0.0001 | LULUS |
| B3.rp.item.WIP-018.Q | WIP-018 kolom Q | REKON PERSEDIAAN!Q63 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-018.S | WIP-018 kolom S | REKON PERSEDIAAN!S63 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-018.U | WIP-018 kolom U | REKON PERSEDIAAN!U63 | -17218.94 | -17218.94 | 0 | 1 | LULUS |
| B3.rp.item.WIP-018.V | WIP-018 kolom V | REKON PERSEDIAAN!V63 | -17218.94 | -17218.94 | 0 | 1 | LULUS |
| B3.rp.item.WIP-023.N | WIP-023 kolom N | REKON PERSEDIAAN!N64 | 0.99 | 0.99 | 0 | 1 | LULUS |
| B3.rp.item.WIP-023.O | WIP-023 kolom O | REKON PERSEDIAAN!O64 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-023.P | WIP-023 kolom P | REKON PERSEDIAAN!P64 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-023.Q | WIP-023 kolom Q | REKON PERSEDIAAN!Q64 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-023.S | WIP-023 kolom S | REKON PERSEDIAAN!S64 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-023.U | WIP-023 kolom U | REKON PERSEDIAAN!U64 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-023.V | WIP-023 kolom V | REKON PERSEDIAAN!V64 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-025.N | WIP-025 kolom N | REKON PERSEDIAAN!N65 | -2009601.76 | -2009601.76 | 0 | 1 | LULUS |
| B3.rp.item.WIP-025.O | WIP-025 kolom O | REKON PERSEDIAAN!O65 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-025.P | WIP-025 kolom P | REKON PERSEDIAAN!P65 | 365.3821381818181818181818181818181818182 | 365.38213818181816 | -2.18182e-14 | 0.0001 | LULUS |
| B3.rp.item.WIP-025.Q | WIP-025 kolom Q | REKON PERSEDIAAN!Q65 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-025.S | WIP-025 kolom S | REKON PERSEDIAAN!S65 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-025.U | WIP-025 kolom U | REKON PERSEDIAAN!U65 | -2009601.76 | -2009601.76 | 0 | 1 | LULUS |
| B3.rp.item.WIP-025.V | WIP-025 kolom V | REKON PERSEDIAAN!V65 | -2009601.76 | -2009601.76 | 0 | 1 | LULUS |
| B3.rp.item.WIP-026.N | WIP-026 kolom N | REKON PERSEDIAAN!N66 | -2529933.77 | -2529933.77 | 0 | 1 | LULUS |
| B3.rp.item.WIP-026.O | WIP-026 kolom O | REKON PERSEDIAAN!O66 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-026.P | WIP-026 kolom P | REKON PERSEDIAAN!P66 | 22999.39790909090909090909090909090909091 | 22999.39790909091 | 9.09091e-13 | 0.0001 | LULUS |
| B3.rp.item.WIP-026.Q | WIP-026 kolom Q | REKON PERSEDIAAN!Q66 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-026.S | WIP-026 kolom S | REKON PERSEDIAAN!S66 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-026.U | WIP-026 kolom U | REKON PERSEDIAAN!U66 | -2529933.77 | -2529933.77 | 0 | 1 | LULUS |
| B3.rp.item.WIP-026.V | WIP-026 kolom V | REKON PERSEDIAAN!V66 | -2529933.77 | -2529933.77 | 0 | 1 | LULUS |
| B3.rp.item.WIP-029.N | WIP-029 kolom N | REKON PERSEDIAAN!N67 | -579823.64 | -579823.64 | 0 | 1 | LULUS |
| B3.rp.item.WIP-029.O | WIP-029 kolom O | REKON PERSEDIAAN!O67 | 3.56 | 3.559999999939464 | -6.0536e-11 | 1 | LULUS |
| B3.rp.item.WIP-029.P | WIP-029 kolom P | REKON PERSEDIAAN!P67 | 4638.58912 | 4638.589120000001 | 1e-12 | 0.0001 | LULUS |
| B3.rp.item.WIP-029.Q | WIP-029 kolom Q | REKON PERSEDIAAN!Q67 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-029.S | WIP-029 kolom S | REKON PERSEDIAAN!S67 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-029.U | WIP-029 kolom U | REKON PERSEDIAAN!U67 | -579823.64 | -579823.64 | 0 | 1 | LULUS |
| B3.rp.item.WIP-029.V | WIP-029 kolom V | REKON PERSEDIAAN!V67 | -579827.2 | -579827.2 | 0 | 1 | LULUS |
| B3.rp.item.WIP-031.N | WIP-031 kolom N | REKON PERSEDIAAN!N68 | -10523124.06 | -10523124.06 | 0 | 1 | LULUS |
| B3.rp.item.WIP-031.O | WIP-031 kolom O | REKON PERSEDIAAN!O68 | 7691622.75 | 7691622.749999998 | -2e-9 | 1 | LULUS |
| B3.rp.item.WIP-031.P | WIP-031 kolom P | REKON PERSEDIAAN!P68 | 34615.53967105263157894736842105263157895 | 34615.53967105263 | -1.57895e-12 | 0.0001 | LULUS |
| B3.rp.item.WIP-031.Q | WIP-031 kolom Q | REKON PERSEDIAAN!Q68 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-031.S | WIP-031 kolom S | REKON PERSEDIAAN!S68 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-031.U | WIP-031 kolom U | REKON PERSEDIAAN!U68 | -10523124.06 | -10523124.06 | 0 | 1 | LULUS |
| B3.rp.item.WIP-031.V | WIP-031 kolom V | REKON PERSEDIAAN!V68 | -18214746.81 | -18214746.81 | 0 | 1 | LULUS |
| B3.rp.item.WIP-032.N | WIP-032 kolom N | REKON PERSEDIAAN!N69 | -1844061.74 | -1844061.74 | 0 | 1 | LULUS |
| B3.rp.item.WIP-032.O | WIP-032 kolom O | REKON PERSEDIAAN!O69 | 10915574.66 | 10915574.66 | 0 | 1 | LULUS |
| B3.rp.item.WIP-032.P | WIP-032 kolom P | REKON PERSEDIAAN!P69 | 32929.67392857142857142857142857142857143 | 32929.67392857143 | 1.42857e-12 | 0.0001 | LULUS |
| B3.rp.item.WIP-032.Q | WIP-032 kolom Q | REKON PERSEDIAAN!Q69 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-032.S | WIP-032 kolom S | REKON PERSEDIAAN!S69 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-032.U | WIP-032 kolom U | REKON PERSEDIAAN!U69 | -1844061.74 | -1844061.74 | 0 | 1 | LULUS |
| B3.rp.item.WIP-032.V | WIP-032 kolom V | REKON PERSEDIAAN!V69 | -12759636.4 | -12759636.4 | 0 | 1 | LULUS |
| B3.rp.item.WIP-033.N | WIP-033 kolom N | REKON PERSEDIAAN!N70 | -89872.97 | -89872.97 | 0 | 1 | LULUS |
| B3.rp.item.WIP-033.O | WIP-033 kolom O | REKON PERSEDIAAN!O70 | 179374.1 | 179374.1 | 0 | 1 | LULUS |
| B3.rp.item.WIP-033.P | WIP-033 kolom P | REKON PERSEDIAAN!P70 | 23966.12533333333333333333333333333333333 | 23966.125333333333 | -3.33333e-13 | 0.0001 | LULUS |
| B3.rp.item.WIP-033.Q | WIP-033 kolom Q | REKON PERSEDIAAN!Q70 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-033.S | WIP-033 kolom S | REKON PERSEDIAAN!S70 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-033.U | WIP-033 kolom U | REKON PERSEDIAAN!U70 | -89872.97 | -89872.97 | 0 | 1 | LULUS |
| B3.rp.item.WIP-033.V | WIP-033 kolom V | REKON PERSEDIAAN!V70 | -269247.07 | -269247.07 | 0 | 1 | LULUS |
| B3.rp.item.WIP-035.N | WIP-035 kolom N | REKON PERSEDIAAN!N71 | 0.17 | 0.17 | 0 | 1 | LULUS |
| B3.rp.item.WIP-035.O | WIP-035 kolom O | REKON PERSEDIAAN!O71 | 964768.86 | 964768.86 | 0 | 1 | LULUS |
| B3.rp.item.WIP-035.P | WIP-035 kolom P | REKON PERSEDIAAN!P71 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-035.Q | WIP-035 kolom Q | REKON PERSEDIAAN!Q71 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-035.S | WIP-035 kolom S | REKON PERSEDIAAN!S71 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-035.U | WIP-035 kolom U | REKON PERSEDIAAN!U71 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-035.V | WIP-035 kolom V | REKON PERSEDIAAN!V71 | -964768.69 | -964768.69 | 0 | 1 | LULUS |
| B3.rp.item.WIP-036.N | WIP-036 kolom N | REKON PERSEDIAAN!N72 | -99293.5 | -99293.5 | 0 | 1 | LULUS |
| B3.rp.item.WIP-036.O | WIP-036 kolom O | REKON PERSEDIAAN!O72 | 52732.64 | 52732.640000000014 | 1.4e-11 | 1 | LULUS |
| B3.rp.item.WIP-036.P | WIP-036 kolom P | REKON PERSEDIAAN!P72 | 76971.70542635658914728682170542635658915 | 76971.70542635658 | -9.14729e-12 | 0.0001 | LULUS |
| B3.rp.item.WIP-036.Q | WIP-036 kolom Q | REKON PERSEDIAAN!Q72 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-036.S | WIP-036 kolom S | REKON PERSEDIAAN!S72 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-036.U | WIP-036 kolom U | REKON PERSEDIAAN!U72 | -99293.5 | -99293.5 | 0 | 1 | LULUS |
| B3.rp.item.WIP-036.V | WIP-036 kolom V | REKON PERSEDIAAN!V72 | -152026.14 | -152026.14 | 0 | 1 | LULUS |
| B3.rp.item.WIP-037.N | WIP-037 kolom N | REKON PERSEDIAAN!N73 | -102793.27 | -102793.27 | 0 | 1 | LULUS |
| B3.rp.item.WIP-037.O | WIP-037 kolom O | REKON PERSEDIAAN!O73 | 94660.81 | 94660.80999999998 | -2e-11 | 1 | LULUS |
| B3.rp.item.WIP-037.P | WIP-037 kolom P | REKON PERSEDIAAN!P73 | 76143.16296296296296296296296296296296296 | 76143.16296296296 | -2.96296e-12 | 0.0001 | LULUS |
| B3.rp.item.WIP-037.Q | WIP-037 kolom Q | REKON PERSEDIAAN!Q73 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-037.S | WIP-037 kolom S | REKON PERSEDIAAN!S73 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-037.U | WIP-037 kolom U | REKON PERSEDIAAN!U73 | -102793.27 | -102793.27 | 0 | 1 | LULUS |
| B3.rp.item.WIP-037.V | WIP-037 kolom V | REKON PERSEDIAAN!V73 | -197454.08 | -197454.08 | 0 | 1 | LULUS |
| B3.rp.item.WIP-038.N | WIP-038 kolom N | REKON PERSEDIAAN!N74 | -134123.89 | -134123.89 | 0 | 1 | LULUS |
| B3.rp.item.WIP-038.O | WIP-038 kolom O | REKON PERSEDIAAN!O74 | 228373.1 | 228373.09999999998 | -2e-11 | 1 | LULUS |
| B3.rp.item.WIP-038.P | WIP-038 kolom P | REKON PERSEDIAAN!P74 | 72499.4 | 72499.40000000001 | 1e-11 | 0.0001 | LULUS |
| B3.rp.item.WIP-038.Q | WIP-038 kolom Q | REKON PERSEDIAAN!Q74 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-038.S | WIP-038 kolom S | REKON PERSEDIAAN!S74 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-038.U | WIP-038 kolom U | REKON PERSEDIAAN!U74 | -134123.89 | -134123.89 | 0 | 1 | LULUS |
| B3.rp.item.WIP-038.V | WIP-038 kolom V | REKON PERSEDIAAN!V74 | -362496.99 | -362496.99 | 0 | 1 | LULUS |
| B3.rp.item.WIP-039.N | WIP-039 kolom N | REKON PERSEDIAAN!N75 | -307599.53 | -307599.53 | 0 | 1 | LULUS |
| B3.rp.item.WIP-039.O | WIP-039 kolom O | REKON PERSEDIAAN!O75 | -194366.72 | -194366.72000000003 | -3e-11 | 1 | LULUS |
| B3.rp.item.WIP-039.P | WIP-039 kolom P | REKON PERSEDIAAN!P75 | 39435.83717948717948717948717948717948718 | 39435.837179487185 | 5.51282e-12 | 0.0001 | LULUS |
| B3.rp.item.WIP-039.Q | WIP-039 kolom Q | REKON PERSEDIAAN!Q75 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-039.S | WIP-039 kolom S | REKON PERSEDIAAN!S75 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-039.U | WIP-039 kolom U | REKON PERSEDIAAN!U75 | -307599.53 | -307599.53 | 0 | 1 | LULUS |
| B3.rp.item.WIP-039.V | WIP-039 kolom V | REKON PERSEDIAAN!V75 | -113232.81 | -113232.81 | 0 | 1 | LULUS |
| B3.rp.item.WIP-042.N | WIP-042 kolom N | REKON PERSEDIAAN!N76 | -8907.82 | -8907.82 | 0 | 1 | LULUS |
| B3.rp.item.WIP-042.O | WIP-042 kolom O | REKON PERSEDIAAN!O76 | 53471.9 | 53471.9 | 0 | 1 | LULUS |
| B3.rp.item.WIP-042.P | WIP-042 kolom P | REKON PERSEDIAAN!P76 | 1781.564 | 1781.5639999999999 | -1e-13 | 0.0001 | LULUS |
| B3.rp.item.WIP-042.Q | WIP-042 kolom Q | REKON PERSEDIAAN!Q76 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-042.S | WIP-042 kolom S | REKON PERSEDIAAN!S76 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-042.U | WIP-042 kolom U | REKON PERSEDIAAN!U76 | -8907.82 | -8907.82 | 0 | 1 | LULUS |
| B3.rp.item.WIP-042.V | WIP-042 kolom V | REKON PERSEDIAAN!V76 | -62379.72 | -62379.72 | 0 | 1 | LULUS |
| B3.rp.item.WIP-043.N | WIP-043 kolom N | REKON PERSEDIAAN!N77 | -0.02 | -0.02 | 0 | 1 | LULUS |
| B3.rp.item.WIP-043.O | WIP-043 kolom O | REKON PERSEDIAAN!O77 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-043.P | WIP-043 kolom P | REKON PERSEDIAAN!P77 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-043.Q | WIP-043 kolom Q | REKON PERSEDIAAN!Q77 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-043.S | WIP-043 kolom S | REKON PERSEDIAAN!S77 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-043.U | WIP-043 kolom U | REKON PERSEDIAAN!U77 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-043.V | WIP-043 kolom V | REKON PERSEDIAAN!V77 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-045.N | WIP-045 kolom N | REKON PERSEDIAAN!N78 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-045.O | WIP-045 kolom O | REKON PERSEDIAAN!O78 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-045.P | WIP-045 kolom P | REKON PERSEDIAAN!P78 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-045.Q | WIP-045 kolom Q | REKON PERSEDIAAN!Q78 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-045.S | WIP-045 kolom S | REKON PERSEDIAAN!S78 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-045.U | WIP-045 kolom U | REKON PERSEDIAAN!U78 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-045.V | WIP-045 kolom V | REKON PERSEDIAAN!V78 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-046.N | WIP-046 kolom N | REKON PERSEDIAAN!N79 | 0.15 | 0.15 | 0 | 1 | LULUS |
| B3.rp.item.WIP-046.O | WIP-046 kolom O | REKON PERSEDIAAN!O79 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-046.P | WIP-046 kolom P | REKON PERSEDIAAN!P79 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-046.Q | WIP-046 kolom Q | REKON PERSEDIAAN!Q79 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-046.S | WIP-046 kolom S | REKON PERSEDIAAN!S79 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-046.U | WIP-046 kolom U | REKON PERSEDIAAN!U79 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-046.V | WIP-046 kolom V | REKON PERSEDIAAN!V79 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-079.N | WIP-079 kolom N | REKON PERSEDIAAN!N80 | -0.09 | -0.09 | 0 | 1 | LULUS |
| B3.rp.item.WIP-079.O | WIP-079 kolom O | REKON PERSEDIAAN!O80 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-079.P | WIP-079 kolom P | REKON PERSEDIAAN!P80 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-079.Q | WIP-079 kolom Q | REKON PERSEDIAAN!Q80 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-079.S | WIP-079 kolom S | REKON PERSEDIAAN!S80 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-079.U | WIP-079 kolom U | REKON PERSEDIAAN!U80 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-079.V | WIP-079 kolom V | REKON PERSEDIAAN!V80 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-089.N | WIP-089 kolom N | REKON PERSEDIAAN!N81 | -144778.65 | -144778.65 | 0 | 1 | LULUS |
| B3.rp.item.WIP-089.O | WIP-089 kolom O | REKON PERSEDIAAN!O81 | 70315.31 | 70315.31 | 0 | 1 | LULUS |
| B3.rp.item.WIP-089.P | WIP-089 kolom P | REKON PERSEDIAAN!P81 | 40216.29166666666666666666666666666666667 | 40216.291666666664 | -2.66667e-12 | 0.0001 | LULUS |
| B3.rp.item.WIP-089.Q | WIP-089 kolom Q | REKON PERSEDIAAN!Q81 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-089.S | WIP-089 kolom S | REKON PERSEDIAAN!S81 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-089.U | WIP-089 kolom U | REKON PERSEDIAAN!U81 | -144778.65 | -144778.65 | 0 | 1 | LULUS |
| B3.rp.item.WIP-089.V | WIP-089 kolom V | REKON PERSEDIAAN!V81 | -215093.96 | -215093.96 | 0 | 1 | LULUS |
| B3.rp.item.WIP-098.N | WIP-098 kolom N | REKON PERSEDIAAN!N82 | -0.02 | -0.02 | 0 | 1 | LULUS |
| B3.rp.item.WIP-098.O | WIP-098 kolom O | REKON PERSEDIAAN!O82 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-098.P | WIP-098 kolom P | REKON PERSEDIAAN!P82 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-098.Q | WIP-098 kolom Q | REKON PERSEDIAAN!Q82 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-098.S | WIP-098 kolom S | REKON PERSEDIAAN!S82 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-098.U | WIP-098 kolom U | REKON PERSEDIAAN!U82 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-098.V | WIP-098 kolom V | REKON PERSEDIAAN!V82 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-106.N | WIP-106 kolom N | REKON PERSEDIAAN!N83 | -3379119.42 | -3379119.42 | 0 | 1 | LULUS |
| B3.rp.item.WIP-106.O | WIP-106 kolom O | REKON PERSEDIAAN!O83 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-106.P | WIP-106 kolom P | REKON PERSEDIAAN!P83 | 27032.95536 | 27032.95536 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-106.Q | WIP-106 kolom Q | REKON PERSEDIAAN!Q83 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-106.S | WIP-106 kolom S | REKON PERSEDIAAN!S83 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-106.U | WIP-106 kolom U | REKON PERSEDIAAN!U83 | -3379119.42 | -3379119.42 | 0 | 1 | LULUS |
| B3.rp.item.WIP-106.V | WIP-106 kolom V | REKON PERSEDIAAN!V83 | -3379119.42 | -3379119.42 | 0 | 1 | LULUS |
| B3.rp.item.WIP-111.N | WIP-111 kolom N | REKON PERSEDIAAN!N84 | 0.55 | 0.55 | 0 | 1 | LULUS |
| B3.rp.item.WIP-111.O | WIP-111 kolom O | REKON PERSEDIAAN!O84 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-111.P | WIP-111 kolom P | REKON PERSEDIAAN!P84 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-111.Q | WIP-111 kolom Q | REKON PERSEDIAAN!Q84 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-111.S | WIP-111 kolom S | REKON PERSEDIAAN!S84 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-111.U | WIP-111 kolom U | REKON PERSEDIAAN!U84 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-111.V | WIP-111 kolom V | REKON PERSEDIAAN!V84 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-114.N | WIP-114 kolom N | REKON PERSEDIAAN!N85 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-114.O | WIP-114 kolom O | REKON PERSEDIAAN!O85 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-114.P | WIP-114 kolom P | REKON PERSEDIAAN!P85 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-114.Q | WIP-114 kolom Q | REKON PERSEDIAAN!Q85 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-114.S | WIP-114 kolom S | REKON PERSEDIAAN!S85 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-114.U | WIP-114 kolom U | REKON PERSEDIAAN!U85 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-114.V | WIP-114 kolom V | REKON PERSEDIAAN!V85 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-121.N | WIP-121 kolom N | REKON PERSEDIAAN!N86 | 0.01 | 0.01 | 0 | 1 | LULUS |
| B3.rp.item.WIP-121.O | WIP-121 kolom O | REKON PERSEDIAAN!O86 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-121.P | WIP-121 kolom P | REKON PERSEDIAAN!P86 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-121.Q | WIP-121 kolom Q | REKON PERSEDIAAN!Q86 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-121.S | WIP-121 kolom S | REKON PERSEDIAAN!S86 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-121.U | WIP-121 kolom U | REKON PERSEDIAAN!U86 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-121.V | WIP-121 kolom V | REKON PERSEDIAAN!V86 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-136.N | WIP-136 kolom N | REKON PERSEDIAAN!N87 | -75027.27 | -75027.27 | 0 | 1 | LULUS |
| B3.rp.item.WIP-136.O | WIP-136 kolom O | REKON PERSEDIAAN!O87 | 21910.46 | 21910.459999999992 | -8e-12 | 1 | LULUS |
| B3.rp.item.WIP-136.P | WIP-136 kolom P | REKON PERSEDIAAN!P87 | 75027.27 | 75027.27 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-136.Q | WIP-136 kolom Q | REKON PERSEDIAAN!Q87 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-136.S | WIP-136 kolom S | REKON PERSEDIAAN!S87 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-136.U | WIP-136 kolom U | REKON PERSEDIAAN!U87 | -75027.27 | -75027.27 | 0 | 1 | LULUS |
| B3.rp.item.WIP-136.V | WIP-136 kolom V | REKON PERSEDIAAN!V87 | -96937.73 | -96937.73 | 0 | 1 | LULUS |
| B3.rp.item.WIP-137.N | WIP-137 kolom N | REKON PERSEDIAAN!N88 | -14865 | -14865 | 0 | 1 | LULUS |
| B3.rp.item.WIP-137.O | WIP-137 kolom O | REKON PERSEDIAAN!O88 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-137.P | WIP-137 kolom P | REKON PERSEDIAAN!P88 | 19820 | 19820 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-137.Q | WIP-137 kolom Q | REKON PERSEDIAAN!Q88 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-137.S | WIP-137 kolom S | REKON PERSEDIAAN!S88 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-137.U | WIP-137 kolom U | REKON PERSEDIAAN!U88 | -14865 | -14865 | 0 | 1 | LULUS |
| B3.rp.item.WIP-137.V | WIP-137 kolom V | REKON PERSEDIAAN!V88 | -14865 | -14865 | 0 | 1 | LULUS |
| B3.rp.item.WIP-140.N | WIP-140 kolom N | REKON PERSEDIAAN!N89 | -44961.95 | -44961.95 | 0 | 1 | LULUS |
| B3.rp.item.WIP-140.O | WIP-140 kolom O | REKON PERSEDIAAN!O89 | 17984.77 | 17984.770000000004 | 4e-12 | 1 | LULUS |
| B3.rp.item.WIP-140.P | WIP-140 kolom P | REKON PERSEDIAAN!P89 | 74936.58333333333333333333333333333333333 | 74936.58333333333 | -3.33333e-12 | 0.0001 | LULUS |
| B3.rp.item.WIP-140.Q | WIP-140 kolom Q | REKON PERSEDIAAN!Q89 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-140.S | WIP-140 kolom S | REKON PERSEDIAAN!S89 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-140.U | WIP-140 kolom U | REKON PERSEDIAAN!U89 | -44961.95 | -44961.95 | 0 | 1 | LULUS |
| B3.rp.item.WIP-140.V | WIP-140 kolom V | REKON PERSEDIAAN!V89 | -62946.72 | -62946.72 | 0 | 1 | LULUS |
| B3.rp.item.WIP-145.N | WIP-145 kolom N | REKON PERSEDIAAN!N90 | -140000 | -140000 | 0 | 1 | LULUS |
| B3.rp.item.WIP-145.O | WIP-145 kolom O | REKON PERSEDIAAN!O90 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-145.P | WIP-145 kolom P | REKON PERSEDIAAN!P90 | 1000 | 1000 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-145.Q | WIP-145 kolom Q | REKON PERSEDIAAN!Q90 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-145.S | WIP-145 kolom S | REKON PERSEDIAAN!S90 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-145.U | WIP-145 kolom U | REKON PERSEDIAAN!U90 | -140000 | -140000 | 0 | 1 | LULUS |
| B3.rp.item.WIP-145.V | WIP-145 kolom V | REKON PERSEDIAAN!V90 | -140000 | -140000 | 0 | 1 | LULUS |
| B3.rp.item.WIP-146.N | WIP-146 kolom N | REKON PERSEDIAAN!N91 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-146.O | WIP-146 kolom O | REKON PERSEDIAAN!O91 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-146.P | WIP-146 kolom P | REKON PERSEDIAAN!P91 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-146.Q | WIP-146 kolom Q | REKON PERSEDIAAN!Q91 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-146.S | WIP-146 kolom S | REKON PERSEDIAAN!S91 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.WIP-146.U | WIP-146 kolom U | REKON PERSEDIAAN!U91 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.WIP-146.V | WIP-146 kolom V | REKON PERSEDIAAN!V91 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-001.N | FG-001 kolom N | REKON PERSEDIAAN!N92 | 17.84 | 17.84 | 0 | 1 | LULUS |
| B3.rp.item.FG-001.O | FG-001 kolom O | REKON PERSEDIAAN!O92 | -9986650.239522 | -9986650.239522014 | -1.4e-8 | 1 | LULUS |
| B3.rp.item.FG-001.P | FG-001 kolom P | REKON PERSEDIAAN!P92 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-001.Q | FG-001 kolom Q | REKON PERSEDIAAN!Q92 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-001.S | FG-001 kolom S | REKON PERSEDIAAN!S92 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-001.U | FG-001 kolom U | REKON PERSEDIAAN!U92 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-001.V | FG-001 kolom V | REKON PERSEDIAAN!V92 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-009.N | FG-009 kolom N | REKON PERSEDIAAN!N93 | 0.01 | 0.01 | 0 | 1 | LULUS |
| B3.rp.item.FG-009.O | FG-009 kolom O | REKON PERSEDIAAN!O93 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-009.P | FG-009 kolom P | REKON PERSEDIAAN!P93 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-009.Q | FG-009 kolom Q | REKON PERSEDIAAN!Q93 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-009.S | FG-009 kolom S | REKON PERSEDIAAN!S93 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-009.U | FG-009 kolom U | REKON PERSEDIAAN!U93 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-009.V | FG-009 kolom V | REKON PERSEDIAAN!V93 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-010.N | FG-010 kolom N | REKON PERSEDIAAN!N94 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-010.O | FG-010 kolom O | REKON PERSEDIAAN!O94 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-010.P | FG-010 kolom P | REKON PERSEDIAAN!P94 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-010.Q | FG-010 kolom Q | REKON PERSEDIAAN!Q94 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-010.S | FG-010 kolom S | REKON PERSEDIAAN!S94 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-010.U | FG-010 kolom U | REKON PERSEDIAAN!U94 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-010.V | FG-010 kolom V | REKON PERSEDIAAN!V94 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-011.N | FG-011 kolom N | REKON PERSEDIAAN!N95 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-011.O | FG-011 kolom O | REKON PERSEDIAAN!O95 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-011.P | FG-011 kolom P | REKON PERSEDIAAN!P95 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-011.Q | FG-011 kolom Q | REKON PERSEDIAAN!Q95 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-011.S | FG-011 kolom S | REKON PERSEDIAAN!S95 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-011.U | FG-011 kolom U | REKON PERSEDIAAN!U95 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-011.V | FG-011 kolom V | REKON PERSEDIAAN!V95 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-012.N | FG-012 kolom N | REKON PERSEDIAAN!N96 | -0.01 | -0.01 | 0 | 1 | LULUS |
| B3.rp.item.FG-012.O | FG-012 kolom O | REKON PERSEDIAAN!O96 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-012.P | FG-012 kolom P | REKON PERSEDIAAN!P96 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-012.Q | FG-012 kolom Q | REKON PERSEDIAAN!Q96 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-012.S | FG-012 kolom S | REKON PERSEDIAAN!S96 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-012.U | FG-012 kolom U | REKON PERSEDIAAN!U96 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-012.V | FG-012 kolom V | REKON PERSEDIAAN!V96 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-013.N | FG-013 kolom N | REKON PERSEDIAAN!N97 | -0.05 | -0.05 | 0 | 1 | LULUS |
| B3.rp.item.FG-013.O | FG-013 kolom O | REKON PERSEDIAAN!O97 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-013.P | FG-013 kolom P | REKON PERSEDIAAN!P97 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-013.Q | FG-013 kolom Q | REKON PERSEDIAAN!Q97 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-013.S | FG-013 kolom S | REKON PERSEDIAAN!S97 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-013.U | FG-013 kolom U | REKON PERSEDIAAN!U97 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-013.V | FG-013 kolom V | REKON PERSEDIAAN!V97 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-014.N | FG-014 kolom N | REKON PERSEDIAAN!N98 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-014.O | FG-014 kolom O | REKON PERSEDIAAN!O98 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-014.P | FG-014 kolom P | REKON PERSEDIAAN!P98 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-014.Q | FG-014 kolom Q | REKON PERSEDIAAN!Q98 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-014.S | FG-014 kolom S | REKON PERSEDIAAN!S98 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-014.U | FG-014 kolom U | REKON PERSEDIAAN!U98 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-014.V | FG-014 kolom V | REKON PERSEDIAAN!V98 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-016.N | FG-016 kolom N | REKON PERSEDIAAN!N99 | -0.01 | -0.01 | 0 | 1 | LULUS |
| B3.rp.item.FG-016.O | FG-016 kolom O | REKON PERSEDIAAN!O99 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-016.P | FG-016 kolom P | REKON PERSEDIAAN!P99 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-016.Q | FG-016 kolom Q | REKON PERSEDIAAN!Q99 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-016.S | FG-016 kolom S | REKON PERSEDIAAN!S99 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-016.U | FG-016 kolom U | REKON PERSEDIAAN!U99 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-016.V | FG-016 kolom V | REKON PERSEDIAAN!V99 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-018.N | FG-018 kolom N | REKON PERSEDIAAN!N100 | -0.03 | -0.03 | 0 | 1 | LULUS |
| B3.rp.item.FG-018.O | FG-018 kolom O | REKON PERSEDIAAN!O100 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-018.P | FG-018 kolom P | REKON PERSEDIAAN!P100 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-018.Q | FG-018 kolom Q | REKON PERSEDIAAN!Q100 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-018.S | FG-018 kolom S | REKON PERSEDIAAN!S100 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-018.U | FG-018 kolom U | REKON PERSEDIAAN!U100 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-018.V | FG-018 kolom V | REKON PERSEDIAAN!V100 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-101.N | FG-101 kolom N | REKON PERSEDIAAN!N101 | -1692347.24 | -1692347.24 | 0 | 1 | LULUS |
| B3.rp.item.FG-101.O | FG-101 kolom O | REKON PERSEDIAAN!O101 | -7813116.4894584 | -7813116.489458403 | -3e-9 | 1 | LULUS |
| B3.rp.item.FG-101.P | FG-101 kolom P | REKON PERSEDIAAN!P101 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-101.Q | FG-101 kolom Q | REKON PERSEDIAAN!Q101 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-101.S | FG-101 kolom S | REKON PERSEDIAAN!S101 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-101.U | FG-101 kolom U | REKON PERSEDIAAN!U101 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-101.V | FG-101 kolom V | REKON PERSEDIAAN!V101 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-102.N | FG-102 kolom N | REKON PERSEDIAAN!N102 | 974521.91 | 974521.91 | 0 | 1 | LULUS |
| B3.rp.item.FG-102.O | FG-102 kolom O | REKON PERSEDIAAN!O102 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-102.P | FG-102 kolom P | REKON PERSEDIAAN!P102 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-102.Q | FG-102 kolom Q | REKON PERSEDIAAN!Q102 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-102.S | FG-102 kolom S | REKON PERSEDIAAN!S102 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-102.U | FG-102 kolom U | REKON PERSEDIAAN!U102 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-102.V | FG-102 kolom V | REKON PERSEDIAAN!V102 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-110.N | FG-110 kolom N | REKON PERSEDIAAN!N103 | 0.42 | 0.42 | 0 | 1 | LULUS |
| B3.rp.item.FG-110.O | FG-110 kolom O | REKON PERSEDIAAN!O103 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-110.P | FG-110 kolom P | REKON PERSEDIAAN!P103 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-110.Q | FG-110 kolom Q | REKON PERSEDIAAN!Q103 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-110.S | FG-110 kolom S | REKON PERSEDIAAN!S103 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-110.U | FG-110 kolom U | REKON PERSEDIAAN!U103 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-110.V | FG-110 kolom V | REKON PERSEDIAAN!V103 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-111.N | FG-111 kolom N | REKON PERSEDIAAN!N104 | 0.44 | 0.44 | 0 | 1 | LULUS |
| B3.rp.item.FG-111.O | FG-111 kolom O | REKON PERSEDIAAN!O104 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-111.P | FG-111 kolom P | REKON PERSEDIAAN!P104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-111.Q | FG-111 kolom Q | REKON PERSEDIAAN!Q104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-111.S | FG-111 kolom S | REKON PERSEDIAAN!S104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-111.U | FG-111 kolom U | REKON PERSEDIAAN!U104 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-111.V | FG-111 kolom V | REKON PERSEDIAAN!V104 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-112.N | FG-112 kolom N | REKON PERSEDIAAN!N105 | -0.08 | -0.08 | 0 | 1 | LULUS |
| B3.rp.item.FG-112.O | FG-112 kolom O | REKON PERSEDIAAN!O105 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-112.P | FG-112 kolom P | REKON PERSEDIAAN!P105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-112.Q | FG-112 kolom Q | REKON PERSEDIAAN!Q105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-112.S | FG-112 kolom S | REKON PERSEDIAAN!S105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-112.U | FG-112 kolom U | REKON PERSEDIAAN!U105 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-112.V | FG-112 kolom V | REKON PERSEDIAAN!V105 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-137.N | FG-137 kolom N | REKON PERSEDIAAN!N106 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-137.O | FG-137 kolom O | REKON PERSEDIAAN!O106 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-137.P | FG-137 kolom P | REKON PERSEDIAAN!P106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-137.Q | FG-137 kolom Q | REKON PERSEDIAAN!Q106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-137.S | FG-137 kolom S | REKON PERSEDIAAN!S106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-137.U | FG-137 kolom U | REKON PERSEDIAAN!U106 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-137.V | FG-137 kolom V | REKON PERSEDIAAN!V106 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-138.N | FG-138 kolom N | REKON PERSEDIAAN!N107 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-138.O | FG-138 kolom O | REKON PERSEDIAAN!O107 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-138.P | FG-138 kolom P | REKON PERSEDIAAN!P107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-138.Q | FG-138 kolom Q | REKON PERSEDIAAN!Q107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-138.S | FG-138 kolom S | REKON PERSEDIAAN!S107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-138.U | FG-138 kolom U | REKON PERSEDIAAN!U107 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-138.V | FG-138 kolom V | REKON PERSEDIAAN!V107 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-153.N | FG-153 kolom N | REKON PERSEDIAAN!N108 | 0.12 | 0.12 | 0 | 1 | LULUS |
| B3.rp.item.FG-153.O | FG-153 kolom O | REKON PERSEDIAAN!O108 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-153.P | FG-153 kolom P | REKON PERSEDIAAN!P108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-153.Q | FG-153 kolom Q | REKON PERSEDIAAN!Q108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-153.S | FG-153 kolom S | REKON PERSEDIAAN!S108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-153.U | FG-153 kolom U | REKON PERSEDIAAN!U108 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-153.V | FG-153 kolom V | REKON PERSEDIAAN!V108 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-167.N | FG-167 kolom N | REKON PERSEDIAAN!N109 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-167.O | FG-167 kolom O | REKON PERSEDIAAN!O109 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-167.P | FG-167 kolom P | REKON PERSEDIAAN!P109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-167.Q | FG-167 kolom Q | REKON PERSEDIAAN!Q109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-167.S | FG-167 kolom S | REKON PERSEDIAAN!S109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-167.U | FG-167 kolom U | REKON PERSEDIAAN!U109 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-167.V | FG-167 kolom V | REKON PERSEDIAAN!V109 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-170.N | FG-170 kolom N | REKON PERSEDIAAN!N110 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-170.O | FG-170 kolom O | REKON PERSEDIAAN!O110 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-170.P | FG-170 kolom P | REKON PERSEDIAAN!P110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-170.Q | FG-170 kolom Q | REKON PERSEDIAAN!Q110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-170.S | FG-170 kolom S | REKON PERSEDIAAN!S110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-170.U | FG-170 kolom U | REKON PERSEDIAAN!U110 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-170.V | FG-170 kolom V | REKON PERSEDIAAN!V110 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-180.N | FG-180 kolom N | REKON PERSEDIAAN!N111 | 190369.435275793 | 190369.43527579296 | -4e-11 | 1 | LULUS |
| B3.rp.item.FG-180.O | FG-180 kolom O | REKON PERSEDIAAN!O111 | -2462240.807424207 | -2462240.807424208 | -1e-9 | 1 | LULUS |
| B3.rp.item.FG-180.P | FG-180 kolom P | REKON PERSEDIAAN!P111 | 1328.778770833333333333333333333333333333 | 1328.7787708333335 | 1.66667e-13 | 0.0001 | LULUS |
| B3.rp.item.FG-180.Q | FG-180 kolom Q | REKON PERSEDIAAN!Q111 | 1725.381760991235416666666666666666666667 | 1725.3817609912355 | 8.33333e-14 | 0.0001 | LULUS |
| B3.rp.item.FG-180.S | FG-180 kolom S | REKON PERSEDIAAN!S111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-180.U | FG-180 kolom U | REKON PERSEDIAAN!U111 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-180.V | FG-180 kolom V | REKON PERSEDIAAN!V111 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-181.N | FG-181 kolom N | REKON PERSEDIAAN!N112 | 3032860.34768022 | 3032860.3476802204 | 4e-10 | 1 | LULUS |
| B3.rp.item.FG-181.O | FG-181 kolom O | REKON PERSEDIAAN!O112 | 3024170.37188022 | 3024170.3718802202 | 2e-10 | 1 | LULUS |
| B3.rp.item.FG-181.P | FG-181 kolom P | REKON PERSEDIAAN!P112 | 1316.76082503192848020434227330779054917 | 1316.7608250319286 | 1.19796e-13 | 0.0001 | LULUS |
| B3.rp.item.FG-181.Q | FG-181 kolom Q | REKON PERSEDIAAN!Q112 | 1704.099311325698595146871008939974457216 | 1704.0993113256986 | 4.85313e-15 | 0.0001 | LULUS |
| B3.rp.item.FG-181.S | FG-181 kolom S | REKON PERSEDIAAN!S112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-181.U | FG-181 kolom U | REKON PERSEDIAAN!U112 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-181.V | FG-181 kolom V | REKON PERSEDIAAN!V112 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-182.N | FG-182 kolom N | REKON PERSEDIAAN!N113 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-182.O | FG-182 kolom O | REKON PERSEDIAAN!O113 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-182.P | FG-182 kolom P | REKON PERSEDIAAN!P113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-182.Q | FG-182 kolom Q | REKON PERSEDIAAN!Q113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-182.S | FG-182 kolom S | REKON PERSEDIAAN!S113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-182.U | FG-182 kolom U | REKON PERSEDIAAN!U113 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-182.V | FG-182 kolom V | REKON PERSEDIAAN!V113 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-190.N | FG-190 kolom N | REKON PERSEDIAAN!N114 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-190.O | FG-190 kolom O | REKON PERSEDIAAN!O114 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-190.P | FG-190 kolom P | REKON PERSEDIAAN!P114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-190.Q | FG-190 kolom Q | REKON PERSEDIAAN!Q114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-190.S | FG-190 kolom S | REKON PERSEDIAAN!S114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-190.U | FG-190 kolom U | REKON PERSEDIAAN!U114 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-190.V | FG-190 kolom V | REKON PERSEDIAAN!V114 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-002.N | FG-002 kolom N | REKON PERSEDIAAN!N115 | -1096087.48 | -1096087.48 | 0 | 1 | LULUS |
| B3.rp.item.FG-002.O | FG-002 kolom O | REKON PERSEDIAAN!O115 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-002.P | FG-002 kolom P | REKON PERSEDIAAN!P115 | 22835.15583333333333333333333333333333333 | 22835.155833333334 | 6.66667e-13 | 0.0001 | LULUS |
| B3.rp.item.FG-002.Q | FG-002 kolom Q | REKON PERSEDIAAN!Q115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-002.S | FG-002 kolom S | REKON PERSEDIAAN!S115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-002.U | FG-002 kolom U | REKON PERSEDIAAN!U115 | -1096087.48 | -1096087.48 | 0 | 1 | LULUS |
| B3.rp.item.FG-002.V | FG-002 kolom V | REKON PERSEDIAAN!V115 | -1096087.48 | -1096087.48 | 0 | 1 | LULUS |
| B3.rp.item.FG-008.N | FG-008 kolom N | REKON PERSEDIAAN!N116 | -0.07 | -0.07 | 0 | 1 | LULUS |
| B3.rp.item.FG-008.O | FG-008 kolom O | REKON PERSEDIAAN!O116 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-008.P | FG-008 kolom P | REKON PERSEDIAAN!P116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-008.Q | FG-008 kolom Q | REKON PERSEDIAAN!Q116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-008.S | FG-008 kolom S | REKON PERSEDIAAN!S116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-008.U | FG-008 kolom U | REKON PERSEDIAAN!U116 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-008.V | FG-008 kolom V | REKON PERSEDIAAN!V116 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-035.N | FG-035 kolom N | REKON PERSEDIAAN!N117 | -29725392.52 | -29725392.52 | 0 | 1 | LULUS |
| B3.rp.item.FG-035.O | FG-035 kolom O | REKON PERSEDIAAN!O117 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-035.P | FG-035 kolom P | REKON PERSEDIAAN!P117 | 16199.12398910081743869209809264305177112 | 16199.123989100817 | -4.38692e-13 | 0.0001 | LULUS |
| B3.rp.item.FG-035.Q | FG-035 kolom Q | REKON PERSEDIAAN!Q117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-035.S | FG-035 kolom S | REKON PERSEDIAAN!S117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-035.U | FG-035 kolom U | REKON PERSEDIAAN!U117 | -29725392.52 | -29725392.52 | 0 | 1 | LULUS |
| B3.rp.item.FG-035.V | FG-035 kolom V | REKON PERSEDIAAN!V117 | -29725392.52 | -29725392.52 | 0 | 1 | LULUS |
| B3.rp.item.FG-036.N | FG-036 kolom N | REKON PERSEDIAAN!N118 | -428679.94 | -428679.94 | 0 | 1 | LULUS |
| B3.rp.item.FG-036.O | FG-036 kolom O | REKON PERSEDIAAN!O118 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-036.P | FG-036 kolom P | REKON PERSEDIAAN!P118 | 28578.66266666666666666666666666666666667 | 28578.662666666667 | 3.33333e-13 | 0.0001 | LULUS |
| B3.rp.item.FG-036.Q | FG-036 kolom Q | REKON PERSEDIAAN!Q118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-036.S | FG-036 kolom S | REKON PERSEDIAAN!S118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-036.U | FG-036 kolom U | REKON PERSEDIAAN!U118 | -428679.94 | -428679.94 | 0 | 1 | LULUS |
| B3.rp.item.FG-036.V | FG-036 kolom V | REKON PERSEDIAAN!V118 | -428679.94 | -428679.94 | 0 | 1 | LULUS |
| B3.rp.item.FG-038.N | FG-038 kolom N | REKON PERSEDIAAN!N119 | 0.4 | 0.4 | 0 | 1 | LULUS |
| B3.rp.item.FG-038.O | FG-038 kolom O | REKON PERSEDIAAN!O119 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-038.P | FG-038 kolom P | REKON PERSEDIAAN!P119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-038.Q | FG-038 kolom Q | REKON PERSEDIAAN!Q119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-038.S | FG-038 kolom S | REKON PERSEDIAAN!S119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-038.U | FG-038 kolom U | REKON PERSEDIAAN!U119 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-038.V | FG-038 kolom V | REKON PERSEDIAAN!V119 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-043.N | FG-043 kolom N | REKON PERSEDIAAN!N120 | 1.1 | 1.1 | 0 | 1 | LULUS |
| B3.rp.item.FG-043.O | FG-043 kolom O | REKON PERSEDIAAN!O120 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-043.P | FG-043 kolom P | REKON PERSEDIAAN!P120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-043.Q | FG-043 kolom Q | REKON PERSEDIAAN!Q120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-043.S | FG-043 kolom S | REKON PERSEDIAAN!S120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-043.U | FG-043 kolom U | REKON PERSEDIAAN!U120 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-043.V | FG-043 kolom V | REKON PERSEDIAAN!V120 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-052.N | FG-052 kolom N | REKON PERSEDIAAN!N121 | 0.79 | 0.79 | 0 | 1 | LULUS |
| B3.rp.item.FG-052.O | FG-052 kolom O | REKON PERSEDIAAN!O121 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-052.P | FG-052 kolom P | REKON PERSEDIAAN!P121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-052.Q | FG-052 kolom Q | REKON PERSEDIAAN!Q121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-052.S | FG-052 kolom S | REKON PERSEDIAAN!S121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-052.U | FG-052 kolom U | REKON PERSEDIAAN!U121 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-052.V | FG-052 kolom V | REKON PERSEDIAAN!V121 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-054.N | FG-054 kolom N | REKON PERSEDIAAN!N122 | 1.08 | 1.08 | 0 | 1 | LULUS |
| B3.rp.item.FG-054.O | FG-054 kolom O | REKON PERSEDIAAN!O122 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-054.P | FG-054 kolom P | REKON PERSEDIAAN!P122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-054.Q | FG-054 kolom Q | REKON PERSEDIAAN!Q122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-054.S | FG-054 kolom S | REKON PERSEDIAAN!S122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-054.U | FG-054 kolom U | REKON PERSEDIAAN!U122 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-054.V | FG-054 kolom V | REKON PERSEDIAAN!V122 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-055.N | FG-055 kolom N | REKON PERSEDIAAN!N123 | 0.05 | 0.05 | 0 | 1 | LULUS |
| B3.rp.item.FG-055.O | FG-055 kolom O | REKON PERSEDIAAN!O123 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-055.P | FG-055 kolom P | REKON PERSEDIAAN!P123 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-055.Q | FG-055 kolom Q | REKON PERSEDIAAN!Q123 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-055.S | FG-055 kolom S | REKON PERSEDIAAN!S123 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-055.U | FG-055 kolom U | REKON PERSEDIAAN!U123 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-055.V | FG-055 kolom V | REKON PERSEDIAAN!V123 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-056.N | FG-056 kolom N | REKON PERSEDIAAN!N124 | 0.11 | 0.11 | 0 | 1 | LULUS |
| B3.rp.item.FG-056.O | FG-056 kolom O | REKON PERSEDIAAN!O124 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-056.P | FG-056 kolom P | REKON PERSEDIAAN!P124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-056.Q | FG-056 kolom Q | REKON PERSEDIAAN!Q124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-056.S | FG-056 kolom S | REKON PERSEDIAAN!S124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-056.U | FG-056 kolom U | REKON PERSEDIAAN!U124 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-056.V | FG-056 kolom V | REKON PERSEDIAAN!V124 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-057.N | FG-057 kolom N | REKON PERSEDIAAN!N125 | 0.08 | 0.08 | 0 | 1 | LULUS |
| B3.rp.item.FG-057.O | FG-057 kolom O | REKON PERSEDIAAN!O125 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-057.P | FG-057 kolom P | REKON PERSEDIAAN!P125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-057.Q | FG-057 kolom Q | REKON PERSEDIAAN!Q125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-057.S | FG-057 kolom S | REKON PERSEDIAAN!S125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-057.U | FG-057 kolom U | REKON PERSEDIAAN!U125 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-057.V | FG-057 kolom V | REKON PERSEDIAAN!V125 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-081.N | FG-081 kolom N | REKON PERSEDIAAN!N126 | -660582.41 | -660582.41 | 0 | 1 | LULUS |
| B3.rp.item.FG-081.O | FG-081 kolom O | REKON PERSEDIAAN!O126 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-081.P | FG-081 kolom P | REKON PERSEDIAAN!P126 | 27755.56344537815126050420168067226890756 | 27755.563445378153 | 1.7395e-12 | 0.0001 | LULUS |
| B3.rp.item.FG-081.Q | FG-081 kolom Q | REKON PERSEDIAAN!Q126 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-081.S | FG-081 kolom S | REKON PERSEDIAAN!S126 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-081.U | FG-081 kolom U | REKON PERSEDIAAN!U126 | -660582.41 | -660582.41 | 0 | 1 | LULUS |
| B3.rp.item.FG-081.V | FG-081 kolom V | REKON PERSEDIAAN!V126 | -660582.41 | -660582.41 | 0 | 1 | LULUS |
| B3.rp.item.FG-140.N | FG-140 kolom N | REKON PERSEDIAAN!N127 | -154855618.26 | -154855618.26 | 0 | 1 | LULUS |
| B3.rp.item.FG-140.O | FG-140 kolom O | REKON PERSEDIAAN!O127 | 0.03 | 0.030000001192092896 | 1.19209e-9 | 1 | LULUS |
| B3.rp.item.FG-140.P | FG-140 kolom P | REKON PERSEDIAAN!P127 | 23123.13248618784530386740331491712707182 | 23123.132486187846 | 6.96133e-13 | 0.0001 | LULUS |
| B3.rp.item.FG-140.Q | FG-140 kolom Q | REKON PERSEDIAAN!Q127 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-140.S | FG-140 kolom S | REKON PERSEDIAAN!S127 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-140.U | FG-140 kolom U | REKON PERSEDIAAN!U127 | -154855618.26 | -154855618.26 | 0 | 1 | LULUS |
| B3.rp.item.FG-140.V | FG-140 kolom V | REKON PERSEDIAAN!V127 | -154855618.29 | -154855618.29 | 0 | 1 | LULUS |
| B3.rp.item.FG-151.N | FG-151 kolom N | REKON PERSEDIAAN!N128 | -8.95 | -8.95 | 0 | 1 | LULUS |
| B3.rp.item.FG-151.O | FG-151 kolom O | REKON PERSEDIAAN!O128 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-151.P | FG-151 kolom P | REKON PERSEDIAAN!P128 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-151.Q | FG-151 kolom Q | REKON PERSEDIAAN!Q128 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-151.S | FG-151 kolom S | REKON PERSEDIAAN!S128 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-151.U | FG-151 kolom U | REKON PERSEDIAAN!U128 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-151.V | FG-151 kolom V | REKON PERSEDIAAN!V128 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-152.N | FG-152 kolom N | REKON PERSEDIAAN!N129 | -3.42 | -3.42 | 0 | 1 | LULUS |
| B3.rp.item.FG-152.O | FG-152 kolom O | REKON PERSEDIAAN!O129 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-152.P | FG-152 kolom P | REKON PERSEDIAAN!P129 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-152.Q | FG-152 kolom Q | REKON PERSEDIAAN!Q129 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-152.S | FG-152 kolom S | REKON PERSEDIAAN!S129 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-152.U | FG-152 kolom U | REKON PERSEDIAAN!U129 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-152.V | FG-152 kolom V | REKON PERSEDIAAN!V129 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-158.N | FG-158 kolom N | REKON PERSEDIAAN!N130 | -36275304.55 | -36275304.55 | 0 | 1 | LULUS |
| B3.rp.item.FG-158.O | FG-158 kolom O | REKON PERSEDIAAN!O130 | 143107.66 | 143107.66000000387 | 3.87e-9 | 1 | LULUS |
| B3.rp.item.FG-158.P | FG-158 kolom P | REKON PERSEDIAAN!P130 | 24673.72095633247177254795265950210855666 | 24673.72095633247 | -1.77255e-12 | 0.0001 | LULUS |
| B3.rp.item.FG-158.Q | FG-158 kolom Q | REKON PERSEDIAAN!Q130 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-158.S | FG-158 kolom S | REKON PERSEDIAAN!S130 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-158.U | FG-158 kolom U | REKON PERSEDIAAN!U130 | -36275304.55 | -36275304.55 | 0 | 1 | LULUS |
| B3.rp.item.FG-158.V | FG-158 kolom V | REKON PERSEDIAAN!V130 | -36418412.21 | -36418412.21 | 0 | 1 | LULUS |
| B3.rp.item.FG-159.N | FG-159 kolom N | REKON PERSEDIAAN!N131 | -46574668.62 | -46574668.62 | 0 | 1 | LULUS |
| B3.rp.item.FG-159.O | FG-159 kolom O | REKON PERSEDIAAN!O131 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-159.P | FG-159 kolom P | REKON PERSEDIAAN!P131 | 20150.85390040237096006576385583870549042 | 20150.85390040237 | -9.60066e-13 | 0.0001 | LULUS |
| B3.rp.item.FG-159.Q | FG-159 kolom Q | REKON PERSEDIAAN!Q131 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-159.S | FG-159 kolom S | REKON PERSEDIAAN!S131 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-159.U | FG-159 kolom U | REKON PERSEDIAAN!U131 | -46574668.62 | -46574668.62 | 0 | 1 | LULUS |
| B3.rp.item.FG-159.V | FG-159 kolom V | REKON PERSEDIAAN!V131 | -46574668.62 | -46574668.62 | 0 | 1 | LULUS |
| B3.rp.item.FG-160.N | FG-160 kolom N | REKON PERSEDIAAN!N132 | 0.08 | 0.08 | 0 | 1 | LULUS |
| B3.rp.item.FG-160.O | FG-160 kolom O | REKON PERSEDIAAN!O132 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-160.P | FG-160 kolom P | REKON PERSEDIAAN!P132 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-160.Q | FG-160 kolom Q | REKON PERSEDIAAN!Q132 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-160.S | FG-160 kolom S | REKON PERSEDIAAN!S132 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-160.U | FG-160 kolom U | REKON PERSEDIAAN!U132 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-160.V | FG-160 kolom V | REKON PERSEDIAAN!V132 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-179.N | FG-179 kolom N | REKON PERSEDIAAN!N133 | -3440389.22 | -3440389.22 | 0 | 1 | LULUS |
| B3.rp.item.FG-179.O | FG-179 kolom O | REKON PERSEDIAAN!O133 | 97286.08 | 97286.07999999961 | -3.9e-10 | 1 | LULUS |
| B3.rp.item.FG-179.P | FG-179 kolom P | REKON PERSEDIAAN!P133 | 29480.62742073693230505569837189374464439 | 29480.62742073693 | -2.30506e-12 | 0.0001 | LULUS |
| B3.rp.item.FG-179.Q | FG-179 kolom Q | REKON PERSEDIAAN!Q133 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-179.S | FG-179 kolom S | REKON PERSEDIAAN!S133 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-179.U | FG-179 kolom U | REKON PERSEDIAAN!U133 | -3440389.22 | -3440389.22 | 0 | 1 | LULUS |
| B3.rp.item.FG-179.V | FG-179 kolom V | REKON PERSEDIAAN!V133 | -3537675.3 | -3537675.3 | 0 | 1 | LULUS |
| B3.rp.item.FG-015.N | FG-015 kolom N | REKON PERSEDIAAN!N134 | -0.28 | -0.28 | 0 | 1 | LULUS |
| B3.rp.item.FG-015.O | FG-015 kolom O | REKON PERSEDIAAN!O134 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-015.P | FG-015 kolom P | REKON PERSEDIAAN!P134 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-015.Q | FG-015 kolom Q | REKON PERSEDIAAN!Q134 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-015.S | FG-015 kolom S | REKON PERSEDIAAN!S134 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-015.U | FG-015 kolom U | REKON PERSEDIAAN!U134 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-015.V | FG-015 kolom V | REKON PERSEDIAAN!V134 | 0 | 0 | 0 | 1 | LULUS |
| B3.rp.item.FG-041.N | FG-041 kolom N | REKON PERSEDIAAN!N135 | -2531861.03 | -2531861.03 | 0 | 1 | LULUS |
| B3.rp.item.FG-041.O | FG-041 kolom O | REKON PERSEDIAAN!O135 | 163345.88 | 163345.88000000035 | 3.5e-10 | 1 | LULUS |
| B3.rp.item.FG-041.P | FG-041 kolom P | REKON PERSEDIAAN!P135 | 40836.46822580645161290322580645161290323 | 40836.46822580645 | -1.6129e-12 | 0.0001 | LULUS |
| B3.rp.item.FG-041.Q | FG-041 kolom Q | REKON PERSEDIAAN!Q135 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-041.S | FG-041 kolom S | REKON PERSEDIAAN!S135 | 0 | 0 | 0 | 0.0001 | LULUS |
| B3.rp.item.FG-041.U | FG-041 kolom U | REKON PERSEDIAAN!U135 | -2531861.03 | -2531861.03 | 0 | 1 | LULUS |
| B3.rp.item.FG-041.V | FG-041 kolom V | REKON PERSEDIAAN!V135 | -2695206.91 | -2695206.91 | 0 | 1 | LULUS |
| B3.k2_wip_close | K2 olein di WIP-022, saldo akhir Accurate | REKON PERSEDIAAN!H58 | 225691966.25 | 225691966.25 | 0 | 1 | LULUS |

## f4-analysis (F4) — 1068/1068 lulus

B4 kewajaran, varian (budget WP kosong), bridge GP (reasonableness.ts, variance.ts, bridge.ts) = sel WP: CEK KEWAJARAN, FCC/UU/UO bagian 4, RINGKASAN bagian 2, BRIDGE GP

| ID | Pos | Sel WP | Target | Nilai WP | Selisih | Toleransi | Status |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| B4.trend.input_ton.min | Masuk proses (ton): min Jan–Agu | CEK KEWAJARAN!K6 | 246.9396 | 246.9396 | 0 | 0.0001 | LULUS |
| B4.trend.input_ton.max | Masuk proses (ton): maks Jan–Agu | CEK KEWAJARAN!L6 | 358.31713 | 358.31713 | 0 | 0.0001 | LULUS |
| B4.trend.premium_ratio.min | Barang jadi premium ÷ masuk proses: min Jan–Agu | CEK KEWAJARAN!K7 | 0.9193986753348986821210928487085872500984 | 0.9193986753348987 | 1.78789e-17 | 0.0001 | LULUS |
| B4.trend.premium_ratio.max | Barang jadi premium ÷ masuk proses: maks Jan–Agu | CEK KEWAJARAN!L7 | 1.005633918139704794026598140082697982308 | 1.0056339181397047 | -9.40266e-17 | 0.0001 | LULUS |
| B4.trend.kw2_ratio.min | KW 2 ÷ masuk proses: min Jan–Agu | CEK KEWAJARAN!K8 | 0.02234054509199713672634071388102488987897 | 0.022340545091997135 | -1.72634e-18 | 0.0001 | LULUS |
| B4.trend.kw2_ratio.max | KW 2 ÷ masuk proses: maks Jan–Agu | CEK KEWAJARAN!L8 | 0.04398132439365355121540737523582024728892 | 0.04398132439365355 | -1.21541e-18 | 0.0001 | LULUS |
| B4.trend.waste_ratio.min | Waste ÷ masuk proses: min Jan–Agu | CEK KEWAJARAN!K9 | 0.0267360926897354865506988181112078007546 | 0.026736092689735487 | 4.49301e-19 | 0.0001 | LULUS |
| B4.trend.waste_ratio.max | Waste ÷ masuk proses: maks Jan–Agu | CEK KEWAJARAN!L9 | 0.03357808873627492229807679257318910408665 | 0.03357808873627492 | -2.29808e-18 | 0.0001 | LULUS |
| B4.trend.cassava_peel_price.min | Harga singkong kulit (Rp/kg): min Jan–Agu | CEK KEWAJARAN!K10 | 1868.902565284658300645423432152401193955 | 1868.9025652846583 | -6.45423e-16 | 0.0001 | LULUS |
| B4.trend.cassava_peel_price.max | Harga singkong kulit (Rp/kg): maks Jan–Agu | CEK KEWAJARAN!L10 | 2757.952286824350448622713467044582436877 | 2757.9522868243507 | 2.51377e-13 | 0.0001 | LULUS |
| B4.trend.cassava_flesh_price.min | Harga singkong daging (Rp/kg): min Jan–Agu | CEK KEWAJARAN!K11 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.trend.cassava_flesh_price.max | Harga singkong daging (Rp/kg): maks Jan–Agu | CEK KEWAJARAN!L11 | 4526.804514843972303898321160959878592431 | 4526.804514843972 | -3.03898e-13 | 0.0001 | LULUS |
| B4.trend.cassava_per_kg_input.min | Singkong (kulit + daging) per kg masuk proses: min Jan–Agu | CEK KEWAJARAN!K12 | 2.780046540304427401595257915773688281172 | 2.7800465403044274 | -1.59526e-18 | 0.0001 | LULUS |
| B4.trend.cassava_per_kg_input.max | Singkong (kulit + daging) per kg masuk proses: maks Jan–Agu | CEK KEWAJARAN!L12 | 3.386068033293509829934121542271875389771 | 3.38606803329351 | 1.70066e-16 | 0.0001 | LULUS |
| B4.trend.olein_per_kg_input.min | Olein per kg masuk proses (kg): min Jan–Agu | CEK KEWAJARAN!K13 | 0.2329950347449771810812566050880580007911 | 0.23299503474497718 | -1.08126e-18 | 0.0001 | LULUS |
| B4.trend.olein_per_kg_input.max | Olein per kg masuk proses (kg): maks Jan–Agu | CEK KEWAJARAN!L13 | 0.2696717290630230265575078701930884521206 | 0.269671729063023 | -2.65575e-17 | 0.0001 | LULUS |
| B4.trend.olein_price.min | Harga olein (Rp/kg): min Jan–Agu | CEK KEWAJARAN!K14 | 15543.04133003104690151922838100757544397 | 15543.041330031048 | 1.09848e-12 | 0.0001 | LULUS |
| B4.trend.olein_price.max | Harga olein (Rp/kg): maks Jan–Agu | CEK KEWAJARAN!L14 | 17437.81854350187654936502001191020261194 | 17437.81854350188 | 3.45063e-12 | 0.0001 | LULUS |
| B4.trend.cng_per_kg_input.min | CNG per kg masuk proses (m³): min Jan–Agu | CEK KEWAJARAN!K15 | 0.3211782442597678765734699873265897167685 | 0.3211782442597679 | 2.34265e-17 | 0.0001 | LULUS |
| B4.trend.cng_per_kg_input.max | CNG per kg masuk proses (m³): maks Jan–Agu | CEK KEWAJARAN!L15 | 0.3604236709159183374394012264685313806194 | 0.36042367091591837 | 3.25606e-17 | 0.0001 | LULUS |
| B4.trend.cng_price.min | Harga CNG (Rp/m³): min Jan–Agu | CEK KEWAJARAN!K16 | 9614.357825974719321937767811536332864708 | 9614.35782597472 | 6.78062e-13 | 0.0001 | LULUS |
| B4.trend.cng_price.max | Harga CNG (Rp/m³): maks Jan–Agu | CEK KEWAJARAN!L16 | 10328.13403970566983832046499578158020188 | 10328.13403970567 | 1.6168e-13 | 0.0001 | LULUS |
| B4.trend.carton_per_ton.min | Karton per ton masuk proses (pcs): min Jan–Agu | CEK KEWAJARAN!K17 | 8.516673679067305473744214769472984161023 | 8.516673679067305 | -4.73744e-16 | 0.0001 | LULUS |
| B4.trend.carton_per_ton.max | Karton per ton masuk proses (pcs): maks Jan–Agu | CEK KEWAJARAN!L17 | 36.06203963879054240683943161340631466428 | 36.062039638790544 | 1.59316e-15 | 0.0001 | LULUS |
| B4.trend.dl_hours_per_ton.min | Direct labour per ton (jam): min Jan–Agu | CEK KEWAJARAN!K18 | 69.53058593654174445971924367668383590815 | 69.53058593654174 | -4.45972e-15 | 0.0001 | LULUS |
| B4.trend.dl_hours_per_ton.max | Direct labour per ton (jam): maks Jan–Agu | CEK KEWAJARAN!L18 | 81.62434343571438265991666553563430556875 | 81.62434343571438 | -2.65992e-15 | 0.0001 | LULUS |
| B4.trend.old_card_material_per_kg_input.min | Material kartu lama per kg masuk proses (Rp): min Jan–Agu | CEK KEWAJARAN!K19 | 11540.11532689165600316122201581598959559 | 11540.115326891655 | -1.00316e-12 | 0.0001 | LULUS |
| B4.trend.old_card_material_per_kg_input.max | Material kartu lama per kg masuk proses (Rp): maks Jan–Agu | CEK KEWAJARAN!L19 | 14593.3731932300704251405575464307739941 | 14593.37319323007 | -4.25141e-13 | 0.0001 | LULUS |
| B4.trend.old_card_cost_per_good_kg.min | Kartu lama per kg barang baik (Rp): min Jan–Agu | CEK KEWAJARAN!K20 | 17277.23070107330353612381667675425854321 | 17277.230701073302 | -1.53612e-12 | 0.0001 | LULUS |
| B4.trend.old_card_cost_per_good_kg.max | Kartu lama per kg barang baik (Rp): maks Jan–Agu | CEK KEWAJARAN!L20 | 21439.46865281242413318717860059295661706 | 21439.468652812426 | 1.86681e-12 | 0.0001 | LULUS |
| B4.kpi.input_ton.2026-01 | Masuk proses (ton) 2026-01 | CEK KEWAJARAN!B6 | 358.31713 | 358.31713 | 0 | 0.0001 | LULUS |
| B4.kpi.premium_ratio.2026-01 | Barang jadi premium ÷ masuk proses 2026-01 | CEK KEWAJARAN!B7 | 0.9296796109078011425242214906108452029631 | 0.9296796109078012 | 5.74758e-17 | 0.0001 | LULUS |
| B4.kpi.kw2_ratio.2026-01 | KW 2 ÷ masuk proses 2026-01 | CEK KEWAJARAN!B8 | 0.02234054509199713672634071388102488987897 | 0.022340545091997135 | -1.72634e-18 | 0.0001 | LULUS |
| B4.kpi.waste_ratio.2026-01 | Waste ÷ masuk proses 2026-01 | CEK KEWAJARAN!B9 | 0.0267360926897354865506988181112078007546 | 0.026736092689735487 | 4.49301e-19 | 0.0001 | LULUS |
| B4.kpi.cassava_peel_price.2026-01 | Harga singkong kulit (Rp/kg) 2026-01 | CEK KEWAJARAN!B10 | 1868.902565284658300645423432152401193955 | 1868.9025652846583 | -6.45423e-16 | 0.0001 | LULUS |
| B4.kpi.cassava_flesh_price.2026-01 | Harga singkong daging (Rp/kg) 2026-01 | CEK KEWAJARAN!B11 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.kpi.cassava_per_kg_input.2026-01 | Singkong (kulit + daging) per kg masuk proses 2026-01 | CEK KEWAJARAN!B12 | 3.214476516933477336124008360973420388805 | 3.2144765169334772 | -1.36124e-16 | 0.0001 | LULUS |
| B4.kpi.olein_per_kg_input.2026-01 | Olein per kg masuk proses (kg) 2026-01 | CEK KEWAJARAN!B13 | 0.2696717290630230265575078701930884521206 | 0.269671729063023 | -2.65575e-17 | 0.0001 | LULUS |
| B4.kpi.olein_price.2026-01 | Harga olein (Rp/kg) 2026-01 | CEK KEWAJARAN!B14 | 15543.04133003104690151922838100757544397 | 15543.041330031048 | 1.09848e-12 | 0.0001 | LULUS |
| B4.kpi.cng_per_kg_input.2026-01 | CNG per kg masuk proses (m³) 2026-01 | CEK KEWAJARAN!B15 | 0.3211782442597678765734699873265897167685 | 0.3211782442597679 | 2.34265e-17 | 0.0001 | LULUS |
| B4.kpi.cng_price.2026-01 | Harga CNG (Rp/m³) 2026-01 | CEK KEWAJARAN!B16 | 9627.447266880189800385101707132035812779 | 9627.44726688019 | 1.99615e-13 | 0.0001 | LULUS |
| B4.kpi.carton_per_ton.2026-01 | Karton per ton masuk proses (pcs) 2026-01 | CEK KEWAJARAN!B17 | 29.15015533865210407328279281540349466407 | 29.1501553386521 | -4.07328e-15 | 0.0001 | LULUS |
| B4.kpi.dl_hours_per_ton.2026-01 | Direct labour per ton (jam) 2026-01 | CEK KEWAJARAN!B18 | 69.53058593654174445971924367668383590815 | 69.53058593654174 | -4.45972e-15 | 0.0001 | LULUS |
| B4.kpi.old_card_material_per_kg_input.2026-01 | Material kartu lama per kg masuk proses (Rp) 2026-01 | CEK KEWAJARAN!B19 | 11540.11532689165600316122201581598959559 | 11540.115326891655 | -1.00316e-12 | 0.0001 | LULUS |
| B4.kpi.old_card_cost_per_good_kg.2026-01 | Kartu lama per kg barang baik (Rp) 2026-01 | CEK KEWAJARAN!B20 | 17277.23070107330353612381667675425854321 | 17277.230701073302 | -1.53612e-12 | 0.0001 | LULUS |
| B4.kpi.input_ton.2026-02 | Masuk proses (ton) 2026-02 | CEK KEWAJARAN!C6 | 317.541 | 317.541 | 0 | 0.0001 | LULUS |
| B4.kpi.premium_ratio.2026-02 | Barang jadi premium ÷ masuk proses 2026-02 | CEK KEWAJARAN!C7 | 1.005633918139704794026598140082697982308 | 1.0056339181397047 | -9.40266e-17 | 0.0001 | LULUS |
| B4.kpi.kw2_ratio.2026-02 | KW 2 ÷ masuk proses 2026-02 | CEK KEWAJARAN!C8 | 0.02916473778189273196217181403346339527809 | 0.02916473778189273 | -1.96217e-18 | 0.0001 | LULUS |
| B4.kpi.waste_ratio.2026-02 | Waste ÷ masuk proses 2026-02 | CEK KEWAJARAN!C9 | 0.03049999842540018454309837154887085447234 | 0.030499998425400184 | -5.43098e-19 | 0.0001 | LULUS |
| B4.kpi.cassava_peel_price.2026-02 | Harga singkong kulit (Rp/kg) 2026-02 | CEK KEWAJARAN!C10 | 1886.756061147823338828514597546396068639 | 1886.7560611478234 | 6.11715e-14 | 0.0001 | LULUS |
| B4.kpi.cassava_flesh_price.2026-02 | Harga singkong daging (Rp/kg) 2026-02 | CEK KEWAJARAN!C11 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.kpi.cassava_per_kg_input.2026-02 | Singkong (kulit + daging) per kg masuk proses 2026-02 | CEK KEWAJARAN!C12 | 3.302923312040240472883816578016697056443 | 3.30292331204024 | -4.72884e-16 | 0.0001 | LULUS |
| B4.kpi.olein_per_kg_input.2026-02 | Olein per kg masuk proses (kg) 2026-02 | CEK KEWAJARAN!C13 | 0.2690455720678589536469306325797298616557 | 0.26904557206785895 | -3.64693e-18 | 0.0001 | LULUS |
| B4.kpi.olein_price.2026-02 | Harga olein (Rp/kg) 2026-02 | CEK KEWAJARAN!C14 | 16240.05465302845504664473915231819086302 | 16240.054653028454 | -1.04664e-12 | 0.0001 | LULUS |
| B4.kpi.cng_per_kg_input.2026-02 | CNG per kg masuk proses (m³) 2026-02 | CEK KEWAJARAN!C15 | 0.3336163425058307431166369067301545312259 | 0.3336163425058308 | 5.68834e-17 | 0.0001 | LULUS |
| B4.kpi.cng_price.2026-02 | Harga CNG (Rp/m³) 2026-02 | CEK KEWAJARAN!C16 | 9614.357825974719321937767811536332864708 | 9614.35782597472 | 6.78062e-13 | 0.0001 | LULUS |
| B4.kpi.carton_per_ton.2026-02 | Karton per ton masuk proses (pcs) 2026-02 | CEK KEWAJARAN!C17 | 15.99793412504212054506347211856106770464 | 15.997934125042121 | 4.54937e-16 | 0.0001 | LULUS |
| B4.kpi.dl_hours_per_ton.2026-02 | Direct labour per ton (jam) 2026-02 | CEK KEWAJARAN!C18 | 70.56411612988558957740890152767674095629 | 70.56411612988559 | 4.22591e-16 | 0.0001 | LULUS |
| B4.kpi.old_card_material_per_kg_input.2026-02 | Material kartu lama per kg masuk proses (Rp) 2026-02 | CEK KEWAJARAN!C19 | 11854.11491263997405059504127026116312539 | 11854.114912639974 | -5.0595e-14 | 0.0001 | LULUS |
| B4.kpi.old_card_cost_per_good_kg.2026-02 | Kartu lama per kg barang baik (Rp) 2026-02 | CEK KEWAJARAN!C20 | 17972.91949957685158827173931244662502721 | 17972.91949957685 | -1.58827e-12 | 0.0001 | LULUS |
| B4.kpi.input_ton.2026-03 | Masuk proses (ton) 2026-03 | CEK KEWAJARAN!D6 | 246.9396 | 246.9396 | 0 | 0.0001 | LULUS |
| B4.kpi.premium_ratio.2026-03 | Barang jadi premium ÷ masuk proses 2026-03 | CEK KEWAJARAN!D7 | 0.9459224036970983997706321707818430093837 | 0.9459224036970985 | 1.00229e-16 | 0.0001 | LULUS |
| B4.kpi.kw2_ratio.2026-03 | KW 2 ÷ masuk proses 2026-03 | CEK KEWAJARAN!D8 | 0.02945659586392785928218884293973101114605 | 0.02945659586392786 | 7.17811e-19 | 0.0001 | LULUS |
| B4.kpi.waste_ratio.2026-03 | Waste ÷ masuk proses 2026-03 | CEK KEWAJARAN!D9 | 0.02934280285543509424976795945243290262072 | 0.029342802855435092 | -2.24977e-18 | 0.0001 | LULUS |
| B4.kpi.cassava_peel_price.2026-03 | Harga singkong kulit (Rp/kg) 2026-03 | CEK KEWAJARAN!D10 | 1906.318921352693998264530348912368098666 | 1906.3189213526941 | 1.01735e-13 | 0.0001 | LULUS |
| B4.kpi.cassava_flesh_price.2026-03 | Harga singkong daging (Rp/kg) 2026-03 | CEK KEWAJARAN!D11 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.kpi.cassava_per_kg_input.2026-03 | Singkong (kulit + daging) per kg masuk proses 2026-03 | CEK KEWAJARAN!D12 | 3.386068033293509829934121542271875389771 | 3.38606803329351 | 1.70066e-16 | 0.0001 | LULUS |
| B4.kpi.olein_per_kg_input.2026-03 | Olein per kg masuk proses (kg) 2026-03 | CEK KEWAJARAN!D13 | 0.2668709271416978078850050781648629867385 | 0.2668709271416978 | -7.88501e-18 | 0.0001 | LULUS |
| B4.kpi.olein_price.2026-03 | Harga olein (Rp/kg) 2026-03 | CEK KEWAJARAN!D14 | 16327.73121780898620658260117448900623663 | 16327.731217808985 | -1.20658e-12 | 0.0001 | LULUS |
| B4.kpi.cng_per_kg_input.2026-03 | CNG per kg masuk proses (m³) 2026-03 | CEK KEWAJARAN!D15 | 0.3415885104060944457673050413947378225283 | 0.34158851040609445 | 4.23269e-18 | 0.0001 | LULUS |
| B4.kpi.cng_price.2026-03 | Harga CNG (Rp/m³) 2026-03 | CEK KEWAJARAN!D16 | 9697.123087059987667521025646314817727604 | 9697.123087059987 | -6.67521e-13 | 0.0001 | LULUS |
| B4.kpi.carton_per_ton.2026-03 | Karton per ton masuk proses (pcs) 2026-03 | CEK KEWAJARAN!D17 | 14.41648079125421763054609305271410498762 | 14.416480791254218 | 3.69454e-16 | 0.0001 | LULUS |
| B4.kpi.dl_hours_per_ton.2026-03 | Direct labour per ton (jam) 2026-03 | CEK KEWAJARAN!D18 | 75.77156519246001856324380536779034225373 | 75.77156519246002 | 1.43676e-15 | 0.0001 | LULUS |
| B4.kpi.old_card_material_per_kg_input.2026-03 | Material kartu lama per kg masuk proses (Rp) 2026-03 | CEK KEWAJARAN!D19 | 12047.84202526249333845199392887977464935 | 12047.842025262493 | -3.38452e-13 | 0.0001 | LULUS |
| B4.kpi.old_card_cost_per_good_kg.2026-03 | Kartu lama per kg barang baik (Rp) 2026-03 | CEK KEWAJARAN!D20 | 18460.56685011872917829254576957116802061 | 18460.56685011873 | 8.21707e-13 | 0.0001 | LULUS |
| B4.kpi.input_ton.2026-04 | Masuk proses (ton) 2026-04 | CEK KEWAJARAN!E6 | 248.9925 | 248.9925 | 0 | 0.0001 | LULUS |
| B4.kpi.premium_ratio.2026-04 | Barang jadi premium ÷ masuk proses 2026-04 | CEK KEWAJARAN!E7 | 0.9251764611383877024408365713826721688404 | 0.9251764611383877 | -2.44084e-18 | 0.0001 | LULUS |
| B4.kpi.kw2_ratio.2026-04 | KW 2 ÷ masuk proses 2026-04 | CEK KEWAJARAN!E8 | 0.03976224183459341144813598803176802514132 | 0.03976224183459341 | -1.44814e-18 | 0.0001 | LULUS |
| B4.kpi.waste_ratio.2026-04 | Waste ÷ masuk proses 2026-04 | CEK KEWAJARAN!E9 | 0.03152705402773175898872455997670612568652 | 0.03152705402773176 | 1.01128e-18 | 0.0001 | LULUS |
| B4.kpi.cassava_peel_price.2026-04 | Harga singkong kulit (Rp/kg) 2026-04 | CEK KEWAJARAN!E10 | 2001.604032450490839746256684261198337524 | 2001.6040324504909 | 6.02537e-14 | 0.0001 | LULUS |
| B4.kpi.cassava_flesh_price.2026-04 | Harga singkong daging (Rp/kg) 2026-04 | CEK KEWAJARAN!E11 | 2950 | 2950 | 0 | 0.0001 | LULUS |
| B4.kpi.cassava_per_kg_input.2026-04 | Singkong (kulit + daging) per kg masuk proses 2026-04 | CEK KEWAJARAN!E12 | 3.28085039853466670682851893129311123829 | 3.2808503985346666 | -1.06829e-16 | 0.0001 | LULUS |
| B4.kpi.olein_per_kg_input.2026-04 | Olein per kg masuk proses (kg) 2026-04 | CEK KEWAJARAN!E13 | 0.268379569665752984527646415052662228782 | 0.268379569665753 | 1.54724e-17 | 0.0001 | LULUS |
| B4.kpi.olein_price.2026-04 | Harga olein (Rp/kg) 2026-04 | CEK KEWAJARAN!E14 | 17165.66562650255520056266788378513868417 | 17165.665626502556 | 7.99437e-13 | 0.0001 | LULUS |
| B4.kpi.cng_per_kg_input.2026-04 | CNG per kg masuk proses (m³) 2026-04 | CEK KEWAJARAN!E15 | 0.3463288054229806118658192515838830486862 | 0.3463288054229806 | -1.18658e-17 | 0.0001 | LULUS |
| B4.kpi.cng_price.2026-04 | Harga CNG (Rp/m³) 2026-04 | CEK KEWAJARAN!E16 | 9865.249922883538154204291545884474433744 | 9865.249922883539 | 8.45796e-13 | 0.0001 | LULUS |
| B4.kpi.carton_per_ton.2026-04 | Karton per ton masuk proses (pcs) 2026-04 | CEK KEWAJARAN!E17 | 22.12918059780917095896462744861793025894 | 22.12918059780917 | -9.58965e-16 | 0.0001 | LULUS |
| B4.kpi.dl_hours_per_ton.2026-04 | Direct labour per ton (jam) 2026-04 | CEK KEWAJARAN!E18 | 81.1952167233952829904515196240850628031 | 81.19521672339529 | 7.00955e-15 | 0.0001 | LULUS |
| B4.kpi.old_card_material_per_kg_input.2026-04 | Material kartu lama per kg masuk proses (Rp) 2026-04 | CEK KEWAJARAN!E19 | 12554.41432612608813518479472273261242809 | 12554.414326126089 | 8.64815e-13 | 0.0001 | LULUS |
| B4.kpi.old_card_cost_per_good_kg.2026-04 | Kartu lama per kg barang baik (Rp) 2026-04 | CEK KEWAJARAN!E20 | 19564.51936327224293164736509803582394202 | 19564.519363272244 | 1.06835e-12 | 0.0001 | LULUS |
| B4.kpi.input_ton.2026-05 | Masuk proses (ton) 2026-05 | CEK KEWAJARAN!F6 | 277.0255 | 277.0255 | 0 | 0.0001 | LULUS |
| B4.kpi.premium_ratio.2026-05 | Barang jadi premium ÷ masuk proses 2026-05 | CEK KEWAJARAN!F7 | 0.9251657338403865348135821431601061996098 | 0.9251657338403866 | 6.51864e-17 | 0.0001 | LULUS |
| B4.kpi.kw2_ratio.2026-05 | KW 2 ÷ masuk proses 2026-05 | CEK KEWAJARAN!F8 | 0.03767523206347430110224510018030831096776 | 0.0376752320634743 | -1.10225e-18 | 0.0001 | LULUS |
| B4.kpi.waste_ratio.2026-05 | Waste ÷ masuk proses 2026-05 | CEK KEWAJARAN!F9 | 0.03263237499796950100261528270863151587128 | 0.032632374997969504 | 2.99738e-18 | 0.0001 | LULUS |
| B4.kpi.cassava_peel_price.2026-05 | Harga singkong kulit (Rp/kg) 2026-05 | CEK KEWAJARAN!F10 | 2202.971968980204971344287634774373683552 | 2202.971968980205 | 2.86557e-14 | 0.0001 | LULUS |
| B4.kpi.cassava_flesh_price.2026-05 | Harga singkong daging (Rp/kg) 2026-05 | CEK KEWAJARAN!F11 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.kpi.cassava_per_kg_input.2026-05 | Singkong (kulit + daging) per kg masuk proses 2026-05 | CEK KEWAJARAN!F12 | 3.316174864768766774177828394858957027422 | 3.316174864768767 | 2.25822e-16 | 0.0001 | LULUS |
| B4.kpi.olein_per_kg_input.2026-05 | Olein per kg masuk proses (kg) 2026-05 | CEK KEWAJARAN!F13 | 0.2637843808602457174520035159218194714927 | 0.2637843808602457 | -1.7452e-17 | 0.0001 | LULUS |
| B4.kpi.olein_price.2026-05 | Harga olein (Rp/kg) 2026-05 | CEK KEWAJARAN!F14 | 17381.70888080095791994526171741361614779 | 17381.708880800958 | 8.00547e-14 | 0.0001 | LULUS |
| B4.kpi.cng_per_kg_input.2026-05 | CNG per kg masuk proses (m³) 2026-05 | CEK KEWAJARAN!F15 | 0.3539083848116447763834015280181788319126 | 0.35390838481164477 | -6.3834e-18 | 0.0001 | LULUS |
| B4.kpi.cng_price.2026-05 | Harga CNG (Rp/m³) 2026-05 | CEK KEWAJARAN!F16 | 10106.7372710203259663590135174673838476 | 10106.737271020325 | -9.66359e-13 | 0.0001 | LULUS |
| B4.kpi.carton_per_ton.2026-05 | Karton per ton masuk proses (pcs) 2026-05 | CEK KEWAJARAN!F17 | 24.36598796861660749642180954460870930654 | 24.365987968616608 | 5.03578e-16 | 0.0001 | LULUS |
| B4.kpi.dl_hours_per_ton.2026-05 | Direct labour per ton (jam) 2026-05 | CEK KEWAJARAN!F18 | 77.41525599628915027677957444350790811676 | 77.41525599628915 | -2.7678e-16 | 0.0001 | LULUS |
| B4.kpi.old_card_material_per_kg_input.2026-05 | Material kartu lama per kg masuk proses (Rp) 2026-05 | CEK KEWAJARAN!F19 | 13477.1067225863684029087574970535203438 | 13477.106722586368 | -4.02909e-13 | 0.0001 | LULUS |
| B4.kpi.old_card_cost_per_good_kg.2026-05 | Kartu lama per kg barang baik (Rp) 2026-05 | CEK KEWAJARAN!F20 | 20632.0919615384286843060627415807119824 | 20632.09196153843 | 1.31569e-12 | 0.0001 | LULUS |
| B4.kpi.input_ton.2026-06 | Masuk proses (ton) 2026-06 | CEK KEWAJARAN!G6 | 278.4091 | 278.40909999999997 | -3e-14 | 0.0001 | LULUS |
| B4.kpi.premium_ratio.2026-06 | Barang jadi premium ÷ masuk proses 2026-06 | CEK KEWAJARAN!G7 | 0.9429472671690688271324464609813400495889 | 0.9429472671690688 | -2.71324e-17 | 0.0001 | LULUS |
| B4.kpi.kw2_ratio.2026-06 | KW 2 ÷ masuk proses 2026-06 | CEK KEWAJARAN!G8 | 0.03897142729889216983209241364596200339716 | 0.03897142729889217 | 1.67908e-19 | 0.0001 | LULUS |
| B4.kpi.waste_ratio.2026-06 | Waste ÷ masuk proses 2026-06 | CEK KEWAJARAN!G9 | 0.02740571339083384846256821346716037658252 | 0.02740571339083385 | 1.53743e-18 | 0.0001 | LULUS |
| B4.kpi.cassava_peel_price.2026-06 | Harga singkong kulit (Rp/kg) 2026-06 | CEK KEWAJARAN!G10 | 2600.117440198069749836348040194043388503 | 2600.1174401980697 | -4.98363e-14 | 0.0001 | LULUS |
| B4.kpi.cassava_flesh_price.2026-06 | Harga singkong daging (Rp/kg) 2026-06 | CEK KEWAJARAN!G11 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.kpi.cassava_per_kg_input.2026-06 | Singkong (kulit + daging) per kg masuk proses 2026-06 | CEK KEWAJARAN!G12 | 3.229681993666360043547427149471766547861 | 3.2296819936663606 | 5.56453e-16 | 0.0001 | LULUS |
| B4.kpi.olein_per_kg_input.2026-06 | Olein per kg masuk proses (kg) 2026-06 | CEK KEWAJARAN!G13 | 0.2593557466332817425867186094132698967096 | 0.25935574663328176 | 1.74133e-17 | 0.0001 | LULUS |
| B4.kpi.olein_price.2026-06 | Harga olein (Rp/kg) 2026-06 | CEK KEWAJARAN!G14 | 17437.81854350187654936502001191020261194 | 17437.81854350188 | 3.45063e-12 | 0.0001 | LULUS |
| B4.kpi.cng_per_kg_input.2026-06 | CNG per kg masuk proses (m³) 2026-06 | CEK KEWAJARAN!G15 | 0.3604236709159183374394012264685313806194 | 0.36042367091591837 | 3.25606e-17 | 0.0001 | LULUS |
| B4.kpi.cng_price.2026-06 | Harga CNG (Rp/m³) 2026-06 | CEK KEWAJARAN!G16 | 10190.71219249305285805269289850538317045 | 10190.712192493052 | -8.58053e-13 | 0.0001 | LULUS |
| B4.kpi.carton_per_ton.2026-06 | Karton per ton masuk proses (pcs) 2026-06 | CEK KEWAJARAN!G17 | 36.06203963879054240683943161340631466428 | 36.062039638790544 | 1.59316e-15 | 0.0001 | LULUS |
| B4.kpi.dl_hours_per_ton.2026-06 | Direct labour per ton (jam) 2026-06 | CEK KEWAJARAN!G18 | 72.27493641551228030980309192479699837398 | 72.27493641551229 | 9.6902e-15 | 0.0001 | LULUS |
| B4.kpi.old_card_material_per_kg_input.2026-06 | Material kartu lama per kg masuk proses (Rp) 2026-06 | CEK KEWAJARAN!G19 | 14593.3731932300704251405575464307739941 | 14593.37319323007 | -4.25141e-13 | 0.0001 | LULUS |
| B4.kpi.old_card_cost_per_good_kg.2026-06 | Kartu lama per kg barang baik (Rp) 2026-06 | CEK KEWAJARAN!G20 | 21237.91219771333798331929745457511298273 | 21237.91219771334 | 2.01668e-12 | 0.0001 | LULUS |
| B4.kpi.input_ton.2026-07 | Masuk proses (ton) 2026-07 | CEK KEWAJARAN!H6 | 294.716 | 294.716 | 0 | 0.0001 | LULUS |
| B4.kpi.premium_ratio.2026-07 | Barang jadi premium ÷ masuk proses 2026-07 | CEK KEWAJARAN!H7 | 0.9193986753348986821210928487085872500984 | 0.9193986753348987 | 1.78789e-17 | 0.0001 | LULUS |
| B4.kpi.kw2_ratio.2026-07 | KW 2 ÷ masuk proses 2026-07 | CEK KEWAJARAN!H8 | 0.04398132439365355121540737523582024728892 | 0.04398132439365355 | -1.21541e-18 | 0.0001 | LULUS |
| B4.kpi.waste_ratio.2026-07 | Waste ÷ masuk proses 2026-07 | CEK KEWAJARAN!H9 | 0.03357808873627492229807679257318910408665 | 0.03357808873627492 | -2.29808e-18 | 0.0001 | LULUS |
| B4.kpi.cassava_peel_price.2026-07 | Harga singkong kulit (Rp/kg) 2026-07 | CEK KEWAJARAN!H10 | 2757.952286824350448622713467044582436877 | 2757.9522868243507 | 2.51377e-13 | 0.0001 | LULUS |
| B4.kpi.cassava_flesh_price.2026-07 | Harga singkong daging (Rp/kg) 2026-07 | CEK KEWAJARAN!H11 | 4450.612959719789842381786339754816112084 | 4450.61295971979 | 1.57618e-13 | 0.0001 | LULUS |
| B4.kpi.cassava_per_kg_input.2026-07 | Singkong (kulit + daging) per kg masuk proses 2026-07 | CEK KEWAJARAN!H12 | 3.027209730239087799780127309002565181395 | 3.0272097302390875 | -2.9978e-16 | 0.0001 | LULUS |
| B4.kpi.olein_per_kg_input.2026-07 | Olein per kg masuk proses (kg) 2026-07 | CEK KEWAJARAN!H13 | 0.2626850934458936739097979071377190244167 | 0.2626850934458937 | 2.60902e-17 | 0.0001 | LULUS |
| B4.kpi.olein_price.2026-07 | Harga olein (Rp/kg) 2026-07 | CEK KEWAJARAN!H14 | 17240.00601142170697839635741272967998192 | 17240.00601142171 | 3.0216e-12 | 0.0001 | LULUS |
| B4.kpi.cng_per_kg_input.2026-07 | CNG per kg masuk proses (m³) 2026-07 | CEK KEWAJARAN!H15 | 0.3466314240972868795721983197383243529364 | 0.34663142409728687 | -9.5722e-18 | 0.0001 | LULUS |
| B4.kpi.cng_price.2026-07 | Harga CNG (Rp/m³) 2026-07 | CEK KEWAJARAN!H16 | 10328.13403970566983832046499578158020188 | 10328.13403970567 | 1.6168e-13 | 0.0001 | LULUS |
| B4.kpi.carton_per_ton.2026-07 | Karton per ton masuk proses (pcs) 2026-07 | CEK KEWAJARAN!H17 | 8.516673679067305473744214769472984161023 | 8.516673679067305 | -4.73744e-16 | 0.0001 | LULUS |
| B4.kpi.dl_hours_per_ton.2026-07 | Direct labour per ton (jam) 2026-07 | CEK KEWAJARAN!H18 | 81.62434343571438265991666553563430556875 | 81.62434343571438 | -2.65992e-15 | 0.0001 | LULUS |
| B4.kpi.old_card_material_per_kg_input.2026-07 | Material kartu lama per kg masuk proses (Rp) 2026-07 | CEK KEWAJARAN!H19 | 14569.00343827698530110343517148712658967 | 14569.003438276985 | -3.01103e-13 | 0.0001 | LULUS |
| B4.kpi.old_card_cost_per_good_kg.2026-07 | Kartu lama per kg barang baik (Rp) 2026-07 | CEK KEWAJARAN!H20 | 21439.46865281242413318717860059295661706 | 21439.468652812426 | 1.86681e-12 | 0.0001 | LULUS |
| B4.kpi.input_ton.2026-08 | Masuk proses (ton) 2026-08 | CEK KEWAJARAN!I6 | 338.754 | 338.754 | 0 | 0.0001 | LULUS |
| B4.kpi.premium_ratio.2026-08 | Barang jadi premium ÷ masuk proses 2026-08 | CEK KEWAJARAN!I7 | 0.9378856043028274204880237576530461632925 | 0.9378856043028274 | -2.0488e-17 | 0.0001 | LULUS |
| B4.kpi.kw2_ratio.2026-08 | KW 2 ÷ masuk proses 2026-08 | CEK KEWAJARAN!I8 | 0.04060468658672665119821463362794240068014 | 0.040604686586726654 | 2.80179e-18 | 0.0001 | LULUS |
| B4.kpi.waste_ratio.2026-08 | Waste ÷ masuk proses 2026-08 | CEK KEWAJARAN!I9 | 0.02763067004374856090260188809578632281833 | 0.02763067004374856 | -9.02602e-19 | 0.0001 | LULUS |
| B4.kpi.cassava_peel_price.2026-08 | Harga singkong kulit (Rp/kg) 2026-08 | CEK KEWAJARAN!I10 | 2673.548888688799092040648410962169835701 | 2673.5488886887993 | 2.07959e-13 | 0.0001 | LULUS |
| B4.kpi.cassava_flesh_price.2026-08 | Harga singkong daging (Rp/kg) 2026-08 | CEK KEWAJARAN!I11 | 4526.804514843972303898321160959878592431 | 4526.804514843972 | -3.03898e-13 | 0.0001 | LULUS |
| B4.kpi.cassava_per_kg_input.2026-08 | Singkong (kulit + daging) per kg masuk proses 2026-08 | CEK KEWAJARAN!I12 | 2.780046540304427401595257915773688281172 | 2.7800465403044274 | -1.59526e-18 | 0.0001 | LULUS |
| B4.kpi.olein_per_kg_input.2026-08 | Olein per kg masuk proses (kg) 2026-08 | CEK KEWAJARAN!I13 | 0.2329950347449771810812566050880580007911 | 0.23299503474497718 | -1.08126e-18 | 0.0001 | LULUS |
| B4.kpi.olein_price.2026-08 | Harga olein (Rp/kg) 2026-08 | CEK KEWAJARAN!I14 | 17257.99779372453375228055949726332860328 | 17257.997793724535 | 1.24772e-12 | 0.0001 | LULUS |
| B4.kpi.cng_per_kg_input.2026-08 | CNG per kg masuk proses (m³) 2026-08 | CEK KEWAJARAN!I15 | 0.3356381163916027559822171841513310543935 | 0.33563811639160274 | -1.59822e-17 | 0.0001 | LULUS |
| B4.kpi.cng_price.2026-08 | Harga CNG (Rp/m³) 2026-08 | CEK KEWAJARAN!I16 | 10173.36588404023669765736849221801130862 | 10173.365884040237 | 3.02343e-13 | 0.0001 | LULUS |
| B4.kpi.carton_per_ton.2026-08 | Karton per ton masuk proses (pcs) 2026-08 | CEK KEWAJARAN!I17 | 27.83730967014411637943758597684455386505 | 27.837309670144116 | -3.79438e-16 | 0.0001 | LULUS |
| B4.kpi.dl_hours_per_ton.2026-08 | Direct labour per ton (jam) 2026-08 | CEK KEWAJARAN!I18 | 73.04710793082886106141920095408467501491 | 73.04710793082886 | -1.06142e-15 | 0.0001 | LULUS |
| B4.kpi.old_card_material_per_kg_input.2026-08 | Material kartu lama per kg masuk proses (Rp) 2026-08 | CEK KEWAJARAN!I19 | 14398.49997403514054446589560566074496537 | 14398.49997403514 | -5.44466e-13 | 0.0001 | LULUS |
| B4.kpi.old_card_cost_per_good_kg.2026-08 | Kartu lama per kg barang baik (Rp) 2026-08 | CEK KEWAJARAN!I20 | 20700.66730003187185360490940599862501148 | 20700.66730003187 | -1.8536e-12 | 0.0001 | LULUS |
| B4.kpi.input_ton.2026-09 | Masuk proses (ton) 2026-09 | CEK KEWAJARAN!J6 | 236.923 | 236.923 | 0 | 0.0001 | LULUS |
| B4.kpi.premium_ratio.2026-09 | Barang jadi premium ÷ masuk proses 2026-09 | CEK KEWAJARAN!J7 | 0.9329064717228804295066329566990119152636 | 0.9329064717228804 | -2.95066e-17 | 0.0001 | LULUS |
| B4.kpi.kw2_ratio.2026-09 | KW 2 ÷ masuk proses 2026-09 | CEK KEWAJARAN!J8 | 0.03199773766160313688413535199199739999916 | 0.03199773766160314 | 3.11586e-18 | 0.0001 | LULUS |
| B4.kpi.waste_ratio.2026-09 | Waste ÷ masuk proses 2026-09 | CEK KEWAJARAN!J9 | 0.02743507384255644238845532092705224904294 | 0.027435073842556442 | -3.88455e-19 | 0.0001 | LULUS |
| B4.kpi.cassava_peel_price.2026-09 | Harga singkong kulit (Rp/kg) 2026-09 | CEK KEWAJARAN!J10 | 2942.830190105266760624198846295522015678 | 2942.8301901052664 | -3.60624e-13 | 0.0001 | LULUS |
| B4.kpi.cassava_flesh_price.2026-09 | Harga singkong daging (Rp/kg) 2026-09 | CEK KEWAJARAN!J11 | 4597.338375909804481233052661624090195519 | 4597.338375909804 | -4.81233e-13 | 0.0001 | LULUS |
| B4.kpi.cassava_per_kg_input.2026-09 | Singkong (kulit + daging) per kg masuk proses 2026-09 | CEK KEWAJARAN!J12 | 2.648000646382398500778734019069486710872 | 2.6480006463823984 | -1.00779e-16 | 0.0001 | LULUS |
| B4.kpi.olein_per_kg_input.2026-09 | Olein per kg masuk proses (kg) 2026-09 | CEK KEWAJARAN!J13 | 0.244256572810575587849216834161309792633 | 0.24425657281057558 | -7.84922e-18 | 0.0001 | LULUS |
| B4.kpi.olein_price.2026-09 | Harga olein (Rp/kg) 2026-09 | CEK KEWAJARAN!J14 | 17512.14950675427682737169517884914463453 | 17512.14950675428 | 3.17263e-12 | 0.0001 | LULUS |
| B4.kpi.cng_per_kg_input.2026-09 | CNG per kg masuk proses (m³) 2026-09 | CEK KEWAJARAN!J15 | 0.3223270444159541285565352456283265027034 | 0.32232704441595417 | 4.14435e-17 | 0.0001 | LULUS |
| B4.kpi.cng_price.2026-09 | Harga CNG (Rp/m³) 2026-09 | CEK KEWAJARAN!J16 | 10143.98103571340237962043598180323345195 | 10143.981035713401 | -1.37962e-12 | 0.0001 | LULUS |
| B4.kpi.carton_per_ton.2026-09 | Karton per ton masuk proses (pcs) 2026-09 | CEK KEWAJARAN!J17 | 0.4220780591162529598223895527238807545067 | 0.42207805911625296 | 1.7761e-19 | 0.0001 | LULUS |
| B4.kpi.dl_hours_per_ton.2026-09 | Direct labour per ton (jam) 2026-09 | CEK KEWAJARAN!J18 | 74.80067363658234953972387653372614731368 | 74.80067363658236 | 1.04603e-14 | 0.0001 | LULUS |
| B4.kpi.old_card_material_per_kg_input.2026-09 | Material kartu lama per kg masuk proses (Rp) 2026-09 | CEK KEWAJARAN!J19 | 14836.98795747175242589364477066388657918 | 14836.987957471752 | -4.25894e-13 | 0.0001 | LULUS |
| B4.kpi.old_card_cost_per_good_kg.2026-09 | Kartu lama per kg barang baik (Rp) 2026-09 | CEK KEWAJARAN!J20 | 21489.80382676901122768598379120632555802 | 21489.80382676901 | -1.22769e-12 | 0.0001 | LULUS |
| B4.mom.fcc_cost_per_kg.value | FCC biaya produksi per kg masuk proses (Rp): Sep | CEK KEWAJARAN!C25 | 23478.38101812709614516108609126171794212 | 23478.381018127093 | -3.14516e-12 | 0.0001 | LULUS |
| B4.mom.fcc_cost_per_kg.delta | FCC biaya produksi per kg masuk proses (Rp): Δ % | CEK KEWAJARAN!D25 | 0.064526338971972708956574504472083732335 | 0.06452633897197257 | -1.38957e-16 | 0.0001 | LULUS |
| B4.mom.fcc_material_per_kg.value | FCC material per kg (Rp): Sep | CEK KEWAJARAN!C26 | 18046.1248863953419465395930323354001089 | 18046.12488639534 | -1.94654e-12 | 0.0001 | LULUS |
| B4.mom.fcc_material_per_kg.delta | FCC material per kg (Rp): Δ % | CEK KEWAJARAN!D26 | 0.016876384637583614290377958736235276999 | 0.016876384637583453 | -1.6129e-16 | 0.0001 | LULUS |
| B4.mom.fcc_conversion_per_kg.value | FCC konversi per kg (Rp): Sep | CEK KEWAJARAN!C27 | 5432.25613173175419862149305892631783322 | 5432.256131731754 | -1.98621e-13 | 0.0001 | LULUS |
| B4.mom.fcc_conversion_per_kg.delta | FCC konversi per kg (Rp): Δ % | CEK KEWAJARAN!D27 | 0.260790485261864814452279104157369181393 | 0.260790485261865 | 1.85548e-16 | 0.0001 | LULUS |
| B4.mom.fcc_pool_b_per_kg.value | FCC Grup B per kg (Rp): Sep | CEK KEWAJARAN!C28 | 1452.209176045152222452020276629959944792 | 1452.2091760451522 | -2.2452e-14 | 0.0001 | LULUS |
| B4.mom.fcc_pool_b_per_kg.delta | FCC Grup B per kg (Rp): Δ % | CEK KEWAJARAN!D28 | 0.371847709094127337168052905479855490041 | 0.37184770909412745 | 1.12832e-16 | 0.0001 | LULUS |
| B4.mom.fcc_pool_d_per_kg.value | FCC Grup D per kg (Rp): Sep | CEK KEWAJARAN!C29 | 907.352211890309509840749948295437758259 | 907.3522118903096 | 9.01593e-14 | 0.0001 | LULUS |
| B4.mom.fcc_pool_d_per_kg.delta | FCC Grup D per kg (Rp): Δ % | CEK KEWAJARAN!D29 | 0.566525979027248196847705331709470882489 | 0.5665259790272485 | 3.03152e-16 | 0.0001 | LULUS |
| B4.mom.fcc_pool_e_per_kg.value | FCC Grup E per kg (Rp): Sep | CEK KEWAJARAN!C30 | 1073.275150804623780722006727924262313072 | 1073.2751508046238 | 1.9278e-14 | 0.0001 | LULUS |
| B4.mom.fcc_pool_e_per_kg.delta | FCC Grup E per kg (Rp): Δ % | CEK KEWAJARAN!D30 | 0.589919017585097790833936095307078367019 | 0.5899190175850977 | -9.08339e-17 | 0.0001 | LULUS |
| B4.mom.fcc_other_material_per_kg.value | FCC material lain per kg (Rp): Sep | CEK KEWAJARAN!C31 | 572.2477675043149884139572772588562528754 | 572.247767504315 | 1.1586e-14 | 0.0001 | LULUS |
| B4.mom.fcc_other_material_per_kg.delta | FCC material lain per kg (Rp): Δ % | CEK KEWAJARAN!D31 | -0.356836367176986747333816684152480387085 | -0.35683636717698675 | -2.66618e-18 | 0.0001 | LULUS |
| B4.mom.uu_cost_per_kg.value | Ubi Ungu biaya per kg (Rp): Sep | CEK KEWAJARAN!C32 | 38989.77701194939037433155080213903743316 | 38989.77701194939 | -3.74332e-13 | 0.0001 | LULUS |
| B4.mom.uu_cost_per_kg.delta | Ubi Ungu biaya per kg (Rp): Δ % | CEK KEWAJARAN!D32 | 0.058617745969770873146164847946245321574 | 0.05861774596977076 | -1.13146e-16 | 0.0001 | LULUS |
| B4.mom.uo_cost_per_kg.value | Ubi Orange biaya per kg (Rp): Sep | CEK KEWAJARAN!C33 | 37609.50079310784900603082421264239446058 | 37609.50079310785 | 9.93969e-13 | 0.0001 | LULUS |
| B4.mom.uo_cost_per_kg.delta | Ubi Orange biaya per kg (Rp): Δ % | CEK KEWAJARAN!D33 | 0.092508903487907230140686287143025804967 | 0.09250890348790741 | 1.79859e-16 | 0.0001 | LULUS |
| B4.mom.others_cost_per_kg.value | Lain-lain biaya per kg output (Rp): Sep | CEK KEWAJARAN!C34 | 19078.04667584603300256585377393413242644 | 19078.046675846035 | 1.99743e-12 | 0.0001 | LULUS |
| B4.mom.others_cost_per_kg.delta | Lain-lain biaya per kg output (Rp): Δ % | CEK KEWAJARAN!D34 | -0.0685612308886821491594987308416611853707 | -0.06856123088868205 | 9.91595e-17 | 0.0001 | LULUS |
| B4.mom.pool_fixed_jt.value | Pool tetap (Rp juta): Sep | CEK KEWAJARAN!C35 | 806.3271136200001 | 806.3271136200001 | 0 | 0.0001 | LULUS |
| B4.mom.pool_fixed_jt.delta | Pool tetap (Rp juta): Δ % | CEK KEWAJARAN!D35 | 0.024863855323526806158534485070575702964 | 0.02486385532352675 | -5.61585e-17 | 0.0001 | LULUS |
| B4.mom.pool_variable_jt.value | Pool variabel dan semi-variabel (Rp juta): Sep | CEK KEWAJARAN!C36 | 766.4396235699999 | 766.43962357 | 1e-13 | 0.0001 | LULUS |
| B4.mom.pool_variable_jt.delta | Pool variabel dan semi-variabel (Rp juta): Δ % | CEK KEWAJARAN!D36 | -0.1664803848412545866221797847142319596486 | -0.1664803848412545 | 8.66222e-17 | 0.0001 | LULUS |
| B4.mom.pool_a_per_man_hour.value | Grup A per man-hour tercatat (Rp): Sep | CEK KEWAJARAN!C37 | 21716.31583344069072418955365258005081905 | 21716.31583344069 | -7.2419e-13 | 0.0001 | LULUS |
| B4.mom.pool_a_per_man_hour.delta | Grup A per man-hour tercatat (Rp): Δ % | CEK KEWAJARAN!D37 | 0.033338477274213924105302590094508450641 | 0.03333847727421402 | 9.58947e-17 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.F | FCC Singkong kulit premium (F) | FCC!F110 | 4311.247000383167527002443831962283104637 | 4311.247000383168 | 4.72998e-13 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.G | FCC Singkong kulit premium (G) | FCC!G110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.H | FCC Singkong kulit premium (H) | FCC!H110 | 4311.247000383167527002443831962283104637 | 4311.247000383168 | 4.72998e-13 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.I | FCC Singkong kulit premium (I) | FCC!I110 | 4311.247000383167207752132787403502403735 | 4311.247000383168 | 7.92248e-13 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.J | FCC Singkong kulit premium (J) | FCC!J110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.K | FCC Singkong kulit premium (K) | FCC!K110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.L | FCC Singkong kulit premium (L) | FCC!L110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.M | FCC Singkong kulit premium (M) | FCC!M110 | 0.000000000000319250311044558780700902 | 0 | -3.1925e-13 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.B | FCC Singkong kulit premium (B) | FCC!B110 | 1.465000262291364704988540580694993732141 | 1.4650002622913647 | -4.98854e-18 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.C | FCC Singkong kulit premium (C) | FCC!C110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.D | FCC Singkong kulit premium (D) | FCC!D110 | 2942.83019010527 | 2942.83019010527 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_peel.E | FCC Singkong kulit premium (E) | FCC!E110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.F | FCC Singkong daging premium (F) | FCC!F111 | 5438.653064497742304461787162917910038282 | 5438.653064497742 | -3.04462e-13 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.G | FCC Singkong daging premium (G) | FCC!G111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.H | FCC Singkong daging premium (H) | FCC!H111 | 5438.653064497742304461787162917910038282 | 5438.653064497742 | -3.04462e-13 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.I | FCC Singkong daging premium (I) | FCC!I111 | 5438.653064497742912254192290322172182521 | 5438.653064497742 | -9.12254e-13 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.J | FCC Singkong daging premium (J) | FCC!J111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.K | FCC Singkong daging premium (K) | FCC!K111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.L | FCC Singkong daging premium (L) | FCC!L111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.M | FCC Singkong daging premium (M) | FCC!M111 | -0.000000000000607792405127404262144239 | 0 | 6.07792e-13 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.B | FCC Singkong daging premium (B) | FCC!B111 | 1.183000384091033795790193438374492978731 | 1.1830003840910337 | -9.57902e-17 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.C | FCC Singkong daging premium (C) | FCC!C111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.D | FCC Singkong daging premium (D) | FCC!D111 | 4597.3383759098 | 4597.3383759098 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cassava_flesh.E | FCC Singkong daging premium (E) | FCC!E111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.raw_materials.F | FCC Bahan baku (F) | FCC!F112 | 9749.900064880909831464230994880193142919 | 9749.900064880909 | -8.31464e-13 | 0.0001 | LULUS |
| B4.var.FCC.raw_materials.G | FCC Bahan baku (G) | FCC!G112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.raw_materials.H | FCC Bahan baku (H) | FCC!H112 | 9749.900064880909831464230994880193142919 | 9749.900064880909 | -8.31464e-13 | 0.0001 | LULUS |
| B4.var.FCC.raw_materials.I | FCC Bahan baku (I) | FCC!I112 | 9749.900064880910120006325077725674586256 | 9749.900064880909 | -1.12001e-12 | 0.0001 | LULUS |
| B4.var.FCC.raw_materials.J | FCC Bahan baku (J) | FCC!J112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.raw_materials.K | FCC Bahan baku (K) | FCC!K112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.raw_materials.L | FCC Bahan baku (L) | FCC!L112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.raw_materials.M | FCC Bahan baku (M) | FCC!M112 | -0.000000000000288542094082845481443337 | 0 | 2.88542e-13 | 0.0001 | LULUS |
| B4.var.FCC.olein.F | FCC Minyak olein (F) | FCC!F113 | 4277.4576210662168721483351130958159402 | 4277.457621066217 | 1.27852e-13 | 0.0001 | LULUS |
| B4.var.FCC.olein.G | FCC Minyak olein (G) | FCC!G113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.olein.H | FCC Minyak olein (H) | FCC!H113 | 4277.4576210662168721483351130958159402 | 4277.457621066217 | 1.27852e-13 | 0.0001 | LULUS |
| B4.var.FCC.olein.I | FCC Minyak olein (I) | FCC!I113 | 4277.457621066217045200339350759529467379 | 4277.457621066217 | -4.52003e-14 | 0.0001 | LULUS |
| B4.var.FCC.olein.J | FCC Minyak olein (J) | FCC!J113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.olein.K | FCC Minyak olein (K) | FCC!K113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.olein.L | FCC Minyak olein (L) | FCC!L113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.olein.M | FCC Minyak olein (M) | FCC!M113 | -0.000000000000173052004237663713527179 | 0 | 1.73052e-13 | 0.0001 | LULUS |
| B4.var.FCC.olein.B | FCC Minyak olein (B) | FCC!B113 | 0.244256572810575587849216834161309792633 | 0.24425657281057558 | -7.84922e-18 | 0.0001 | LULUS |
| B4.var.FCC.olein.C | FCC Minyak olein (C) | FCC!C113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.olein.D | FCC Minyak olein (D) | FCC!D113 | 17512.1495067543 | 17512.1495067543 | 0 | 0.0001 | LULUS |
| B4.var.FCC.olein.E | FCC Minyak olein (E) | FCC!E113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.oil.F | FCC Minyak (F) | FCC!F114 | 4277.4576210662168721483351130958159402 | 4277.457621066217 | 1.27852e-13 | 0.0001 | LULUS |
| B4.var.FCC.oil.G | FCC Minyak (G) | FCC!G114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.oil.H | FCC Minyak (H) | FCC!H114 | 4277.4576210662168721483351130958159402 | 4277.457621066217 | 1.27852e-13 | 0.0001 | LULUS |
| B4.var.FCC.oil.I | FCC Minyak (I) | FCC!I114 | 4277.457621066217045200339350759529467379 | 4277.457621066217 | -4.52003e-14 | 0.0001 | LULUS |
| B4.var.FCC.oil.J | FCC Minyak (J) | FCC!J114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.oil.K | FCC Minyak (K) | FCC!K114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.oil.L | FCC Minyak (L) | FCC!L114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.oil.M | FCC Minyak (M) | FCC!M114 | -0.000000000000173052004237663713527179 | 0 | 1.73052e-13 | 0.0001 | LULUS |
| B4.var.FCC.cng.F | FCC CNG (MMBTU) (F) | FCC!F115 | 3269.679425852989367853690861587942074007 | 3269.6794258529894 | 3.21463e-14 | 0.0001 | LULUS |
| B4.var.FCC.cng.G | FCC CNG (MMBTU) (G) | FCC!G115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.H | FCC CNG (MMBTU) (H) | FCC!H115 | 3269.679425852989367853690861587942074007 | 3269.6794258529894 | 3.21463e-14 | 0.0001 | LULUS |
| B4.var.FCC.cng.I | FCC CNG (MMBTU) (I) | FCC!I115 | 3269.67942585298954319256983663144565956 | 3269.6794258529894 | -1.43193e-13 | 0.0001 | LULUS |
| B4.var.FCC.cng.J | FCC CNG (MMBTU) (J) | FCC!J115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.K | FCC CNG (MMBTU) (K) | FCC!K115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.L | FCC CNG (MMBTU) (L) | FCC!L115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.M | FCC CNG (MMBTU) (M) | FCC!M115 | -0.000000000000175338878975043503585553 | 0 | 1.75339e-13 | 0.0001 | LULUS |
| B4.var.FCC.cng.B | FCC CNG (MMBTU) (B) | FCC!B115 | 0.01445626682046913300945876930479522882962 | 0.014456266820469132 | -1.00946e-18 | 0.0001 | LULUS |
| B4.var.FCC.cng.C | FCC CNG (MMBTU) (C) | FCC!C115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.D | FCC CNG (MMBTU) (D) | FCC!D115 | 226177.30195899098 | 226177.30195899098 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.E | FCC CNG (MMBTU) (E) | FCC!E115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.F | FCC CNG (F) | FCC!F116 | 3269.679425852989367853690861587942074007 | 3269.6794258529894 | 3.21463e-14 | 0.0001 | LULUS |
| B4.var.FCC.cng.G | FCC CNG (G) | FCC!G116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.H | FCC CNG (H) | FCC!H116 | 3269.679425852989367853690861587942074007 | 3269.6794258529894 | 3.21463e-14 | 0.0001 | LULUS |
| B4.var.FCC.cng.I | FCC CNG (I) | FCC!I116 | 3269.67942585298954319256983663144565956 | 3269.6794258529894 | -1.43193e-13 | 0.0001 | LULUS |
| B4.var.FCC.cng.J | FCC CNG (J) | FCC!J116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.K | FCC CNG (K) | FCC!K116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.L | FCC CNG (L) | FCC!L116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.cng.M | FCC CNG (M) | FCC!M116 | -0.000000000000175338878975043503585553 | 0 | 1.75339e-13 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.F | FCC Amonium bicarbonate (F) | FCC!F117 | 33.28337583921558481025480852428848191184 | 33.28337583921559 | 5.18975e-15 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.G | FCC Amonium bicarbonate (G) | FCC!G117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.H | FCC Amonium bicarbonate (H) | FCC!H117 | 33.28337583921558481025480852428848191184 | 33.28337583921559 | 5.18975e-15 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.I | FCC Amonium bicarbonate (I) | FCC!I117 | 33.28337583921558481025480852428848191185 | 33.28337583921559 | 5.18975e-15 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.J | FCC Amonium bicarbonate (J) | FCC!J117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.K | FCC Amonium bicarbonate (K) | FCC!K117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.L | FCC Amonium bicarbonate (L) | FCC!L117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.M | FCC Amonium bicarbonate (M) | FCC!M117 | -0.00000000000000000000000000000000000001 | 0 | 1e-38 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.B | FCC Amonium bicarbonate (B) | FCC!B117 | 0.007175327004976300316980622396305972826615 | 0.0071753270049763 | -3.16981e-19 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.C | FCC Amonium bicarbonate (C) | FCC!C117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.D | FCC Amonium bicarbonate (D) | FCC!D117 | 4638.58661997322 | 4638.58661997322 | 0 | 0.0001 | LULUS |
| B4.var.FCC.ammonium.E | FCC Amonium bicarbonate (E) | FCC!E117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.F | FCC HDPE 0,03 (F) | FCC!F118 | 34.8495279206240424104033800010974029537 | 34.84952792062404 | -2.4104e-15 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.G | FCC HDPE 0,03 (G) | FCC!G118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.H | FCC HDPE 0,03 (H) | FCC!H118 | 34.8495279206240424104033800010974029537 | 34.84952792062404 | -2.4104e-15 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.I | FCC HDPE 0,03 (I) | FCC!I118 | 34.84952792062404329676730414522861858074 | 34.84952792062404 | -3.29677e-15 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.J | FCC HDPE 0,03 (J) | FCC!J118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.K | FCC HDPE 0,03 (K) | FCC!K118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.L | FCC HDPE 0,03 (L) | FCC!L118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.M | FCC HDPE 0,03 (M) | FCC!M118 | -0.00000000000000088636392414413121562704 | 0 | 8.86364e-16 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.B | FCC HDPE 0,03 (B) | FCC!B118 | 0.001066591255386771229471178399733246666639 | 0.0010665912553867712 | -2.94712e-20 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.C | FCC HDPE 0,03 (C) | FCC!C118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.D | FCC HDPE 0,03 (D) | FCC!D118 | 32673.7423962723 | 32673.7423962723 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_003.E | FCC HDPE 0,03 (E) | FCC!E118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.F | FCC HDPE 0,05 (F) | FCC!F119 | 270.0547760223227377671226516631985919476 | 270.05477602232276 | 2.22329e-14 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.G | FCC HDPE 0,05 (G) | FCC!G119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.H | FCC HDPE 0,05 (H) | FCC!H119 | 270.0547760223227377671226516631985919476 | 270.05477602232276 | 2.22329e-14 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.I | FCC HDPE 0,05 (I) | FCC!I119 | 270.0547760223227238385467008268509178087 | 270.0547760223227 | -2.38385e-14 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.J | FCC HDPE 0,05 (J) | FCC!J119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.K | FCC HDPE 0,05 (K) | FCC!K119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.L | FCC HDPE 0,05 (L) | FCC!L119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.M | FCC HDPE 0,05 (M) | FCC!M119 | 0.0000000000000139285759508363476741389 | 0.00000000000005684341886080802 | 4.29148e-14 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.B | FCC HDPE 0,05 (B) | FCC!B119 | 0.00785487268015346758229466957619142084137 | 0.007854872680153467 | -5.82295e-19 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.C | FCC HDPE 0,05 (C) | FCC!C119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.D | FCC HDPE 0,05 (D) | FCC!D119 | 34380.5414828247 | 34380.5414828247 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_005.E | FCC HDPE 0,05 (E) | FCC!E119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.F | FCC HDPE 0,07 (F) | FCC!F120 | 189.1434541029089451003068507489775159018 | 189.14345410290895 | 4.89969e-15 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.G | FCC HDPE 0,07 (G) | FCC!G120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.H | FCC HDPE 0,07 (H) | FCC!H120 | 189.1434541029089451003068507489775159018 | 189.14345410290895 | 4.89969e-15 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.I | FCC HDPE 0,07 (I) | FCC!I120 | 189.1434541029089687366781612591432659556 | 189.14345410290895 | -1.87367e-14 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.J | FCC HDPE 0,07 (J) | FCC!J120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.K | FCC HDPE 0,07 (K) | FCC!K120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.L | FCC HDPE 0,07 (L) | FCC!L120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.M | FCC HDPE 0,07 (M) | FCC!M120 | -0.0000000000000236363713105101657500538 | 0 | 2.36364e-14 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.B | FCC HDPE 0,07 (B) | FCC!B120 | 0.005799352532257315667959632454426121566923 | 0.005799352532257315 | -6.6796e-19 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.C | FCC HDPE 0,07 (C) | FCC!C120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.D | FCC HDPE 0,07 (D) | FCC!D120 | 32614.5812055484 | 32614.5812055484 | 0 | 0.0001 | LULUS |
| B4.var.FCC.hdpe_007.E | FCC HDPE 0,07 (E) | FCC!E120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.carton.F | FCC Kemasan IFM (karton) (F) | FCC!F121 | 4.120227701376548498879382753046348391672 | 4.120227701376549 | 5.01121e-16 | 0.0001 | LULUS |
| B4.var.FCC.carton.G | FCC Kemasan IFM (karton) (G) | FCC!G121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.carton.H | FCC Kemasan IFM (karton) (H) | FCC!H121 | 4.120227701376548498879382753046348391672 | 4.120227701376549 | 5.01121e-16 | 0.0001 | LULUS |
| B4.var.FCC.carton.I | FCC Kemasan IFM (karton) (I) | FCC!I121 | 4.120227701376548498879382753046348391671 | 4.120227701376548 | -4.98879e-16 | 0.0001 | LULUS |
| B4.var.FCC.carton.J | FCC Kemasan IFM (karton) (J) | FCC!J121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.carton.K | FCC Kemasan IFM (karton) (K) | FCC!K121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.carton.L | FCC Kemasan IFM (karton) (L) | FCC!L121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.carton.M | FCC Kemasan IFM (karton) (M) | FCC!M121 | 0.000000000000000000000000000000000000001 | 0.0000000000000008881784197001252 | 8.88178e-16 | 0.0001 | LULUS |
| B4.var.FCC.carton.B | FCC Kemasan IFM (karton) (B) | FCC!B121 | 0.0004220780591162529598223895527238807545067 | 0.00042207805911625296 | 1.7761e-22 | 0.0001 | LULUS |
| B4.var.FCC.carton.C | FCC Kemasan IFM (karton) (C) | FCC!C121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.carton.D | FCC Kemasan IFM (karton) (D) | FCC!D121 | 9761.76707693236 | 9761.76707693236 | 0 | 0.0001 | LULUS |
| B4.var.FCC.carton.E | FCC Kemasan IFM (karton) (E) | FCC!E121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.other.F | FCC Biaya lain (plakban, tali, label, plastik) (F) | FCC!F122 | 40.79640591786711716464843008065911709712 | 40.79640591786712 | 2.83535e-15 | 0.0001 | LULUS |
| B4.var.FCC.other.G | FCC Biaya lain (plakban, tali, label, plastik) (G) | FCC!G122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.other.H | FCC Biaya lain (plakban, tali, label, plastik) (H) | FCC!H122 | 40.79640591786711716464843008065911709712 | 40.79640591786712 | 2.83535e-15 | 0.0001 | LULUS |
| B4.var.FCC.other.I | FCC Biaya lain (plakban, tali, label, plastik) (I) | FCC!I122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.other.J | FCC Biaya lain (plakban, tali, label, plastik) (J) | FCC!J122 | 40.79640591786711716464843008065911709712 | 40.79640591786712 | 2.83535e-15 | 0.0001 | LULUS |
| B4.var.FCC.other.K | FCC Biaya lain (plakban, tali, label, plastik) (K) | FCC!K122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.other.L | FCC Biaya lain (plakban, tali, label, plastik) (L) | FCC!L122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.other.M | FCC Biaya lain (plakban, tali, label, plastik) (M) | FCC!M122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.material_others.F | FCC Material lain (F) | FCC!F123 | 572.2477675043149757516155037712674582037 | 572.2477675043149 | -7.57516e-14 | 0.0001 | LULUS |
| B4.var.FCC.material_others.G | FCC Material lain (G) | FCC!G123 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.material_others.H | FCC Material lain (H) | FCC!H123 | 572.2477675043149757516155037712674582037 | 572.2477675043149 | -7.57516e-14 | 0.0001 | LULUS |
| B4.var.FCC.material_others.I | FCC Material lain (I) | FCC!I123 | 531.4513615864478691811263575085576326486 | 531.4513615864478 | -6.91811e-14 | 0.0001 | LULUS |
| B4.var.FCC.material_others.J | FCC Material lain (J) | FCC!J123 | 40.79640591786711716464843008065911709712 | 40.79640591786712 | 2.83535e-15 | 0.0001 | LULUS |
| B4.var.FCC.material_others.K | FCC Material lain (K) | FCC!K123 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.material_others.L | FCC Material lain (L) | FCC!L123 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.material_others.M | FCC Material lain (M) | FCC!M123 | -0.000000000000010594159283817949291541949 | 0.00000000000005773159728050814 | 6.83258e-14 | 0.0001 | LULUS |
| B4.var.FCC.peeling.F | FCC Upah kupas (kg dikupas) (F) | FCC!F124 | 226.2280359487680807688573924861663916125 | 226.2280359487681 | 1.92311e-14 | 0.0001 | LULUS |
| B4.var.FCC.peeling.G | FCC Upah kupas (kg dikupas) (G) | FCC!G124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.H | FCC Upah kupas (kg dikupas) (H) | FCC!H124 | 226.2280359487680807688573924861663916125 | 226.2280359487681 | 1.92311e-14 | 0.0001 | LULUS |
| B4.var.FCC.peeling.I | FCC Upah kupas (kg dikupas) (I) | FCC!I124 | 226.2280359487681105240099103928280496195 | 226.2280359487681 | -1.0524e-14 | 0.0001 | LULUS |
| B4.var.FCC.peeling.J | FCC Upah kupas (kg dikupas) (J) | FCC!J124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.K | FCC Upah kupas (kg dikupas) (K) | FCC!K124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.L | FCC Upah kupas (kg dikupas) (L) | FCC!L124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.M | FCC Upah kupas (kg dikupas) (M) | FCC!M124 | -0.000000000000029755152517906661658007 | 0 | 2.97552e-14 | 0.0001 | LULUS |
| B4.var.FCC.peeling.B | FCC Upah kupas (kg dikupas) (B) | FCC!B124 | 0.9084132819523642702481396909544451150796 | 0.9084132819523643 | 2.97519e-17 | 0.0001 | LULUS |
| B4.var.FCC.peeling.C | FCC Upah kupas (kg dikupas) (C) | FCC!C124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.D | FCC Upah kupas (kg dikupas) (D) | FCC!D124 | 249.03646880036607 | 249.03646880036607 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.E | FCC Upah kupas (kg dikupas) (E) | FCC!E124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.F | FCC Upah kupas (F) | FCC!F125 | 226.2280359487680807688573924861663916125 | 226.2280359487681 | 1.92311e-14 | 0.0001 | LULUS |
| B4.var.FCC.peeling.G | FCC Upah kupas (G) | FCC!G125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.H | FCC Upah kupas (H) | FCC!H125 | 226.2280359487680807688573924861663916125 | 226.2280359487681 | 1.92311e-14 | 0.0001 | LULUS |
| B4.var.FCC.peeling.I | FCC Upah kupas (I) | FCC!I125 | 226.2280359487681105240099103928280496195 | 226.2280359487681 | -1.0524e-14 | 0.0001 | LULUS |
| B4.var.FCC.peeling.J | FCC Upah kupas (J) | FCC!J125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.K | FCC Upah kupas (K) | FCC!K125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.L | FCC Upah kupas (L) | FCC!L125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.peeling.M | FCC Upah kupas (M) | FCC!M125 | -0.000000000000029755152517906661658007 | 0 | 2.97552e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_a.F | FCC Grup A – DL operator (F) | FCC!F126 | 1624.395053246142839656766122326663093072 | 1624.3950532461429 | 6.03432e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_a.G | FCC Grup A – DL operator (G) | FCC!G126 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_a.H | FCC Grup A – DL operator (H) | FCC!H126 | 1624.395053246142839656766122326663093072 | 1624.3950532461429 | 6.03432e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_a.I | FCC Grup A – DL operator (I) | FCC!I126 | 1922.585093165388079671454438783908696074 | 1922.5850931653881 | 2.03285e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_a.J | FCC Grup A – DL operator (J) | FCC!J126 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_a.K | FCC Grup A – DL operator (K) | FCC!K126 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_a.L | FCC Grup A – DL operator (L) | FCC!L126 | -298.1900399192452400146883164572456030018 | -298.19003991924524 | 1.46883e-17 | 0.0001 | LULUS |
| B4.var.FCC.pool_a.M | FCC Grup A – DL operator (M) | FCC!M126 | -0.0000000000000000000000000000000000002 | 0 | 2e-37 | 0.0001 | LULUS |
| B4.var.FCC.direct_labour.F | FCC Tenaga kerja langsung (F) | FCC!F127 | 1624.395053246142839656766122326663093072 | 1624.3950532461429 | 6.03432e-14 | 0.0001 | LULUS |
| B4.var.FCC.direct_labour.G | FCC Tenaga kerja langsung (G) | FCC!G127 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.direct_labour.H | FCC Tenaga kerja langsung (H) | FCC!H127 | 1624.395053246142839656766122326663093072 | 1624.3950532461429 | 6.03432e-14 | 0.0001 | LULUS |
| B4.var.FCC.direct_labour.I | FCC Tenaga kerja langsung (I) | FCC!I127 | 1922.585093165388079671454438783908696074 | 1922.5850931653881 | 2.03285e-14 | 0.0001 | LULUS |
| B4.var.FCC.direct_labour.J | FCC Tenaga kerja langsung (J) | FCC!J127 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.direct_labour.K | FCC Tenaga kerja langsung (K) | FCC!K127 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.direct_labour.L | FCC Tenaga kerja langsung (L) | FCC!L127 | -298.1900399192452400146883164572456030018 | -298.19003991924524 | 1.46883e-17 | 0.0001 | LULUS |
| B4.var.FCC.direct_labour.M | FCC Tenaga kerja langsung (M) | FCC!M127 | -0.0000000000000000000000000000000000002 | 0 | 2e-37 | 0.0001 | LULUS |
| B4.var.FCC.pool_b.F | FCC Grup B – IDL (F) | FCC!F128 | 1452.209176045152222452020276629959944792 | 1452.2091760451522 | -2.2452e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_b.G | FCC Grup B – IDL (G) | FCC!G128 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_b.H | FCC Grup B – IDL (H) | FCC!H128 | 1452.209176045152222452020276629959944792 | 1452.2091760451522 | -2.2452e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_b.I | FCC Grup B – IDL (I) | FCC!I128 | 1718.791071447157304271852036315596206362 | 1718.7910714471573 | -4.27185e-15 | 0.0001 | LULUS |
| B4.var.FCC.pool_b.J | FCC Grup B – IDL (J) | FCC!J128 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_b.K | FCC Grup B – IDL (K) | FCC!K128 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_b.L | FCC Grup B – IDL (L) | FCC!L128 | -266.5818954020050818198317596856362615702 | -266.58189540200505 | 3.18198e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_b.M | FCC Grup B – IDL (M) | FCC!M128 | 0.0000000000000000000000000000000000002 | 0 | -2e-37 | 0.0001 | LULUS |
| B4.var.FCC.pool_c.F | FCC Grup C – energi & utilitas (F) | FCC!F129 | 148.796503796757554142063033137348421217 | 148.79650379675755 | -4.14206e-15 | 0.0001 | LULUS |
| B4.var.FCC.pool_c.G | FCC Grup C – energi & utilitas (G) | FCC!G129 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_c.H | FCC Grup C – energi & utilitas (H) | FCC!H129 | 148.796503796757554142063033137348421217 | 148.79650379675755 | -4.14206e-15 | 0.0001 | LULUS |
| B4.var.FCC.pool_c.I | FCC Grup C – energi & utilitas (I) | FCC!I129 | 191.4629710043997416882278208531885886976 | 191.46297100439972 | -2.16882e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_c.J | FCC Grup C – energi & utilitas (J) | FCC!J129 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_c.K | FCC Grup C – energi & utilitas (K) | FCC!K129 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_c.L | FCC Grup C – energi & utilitas (L) | FCC!L129 | -42.66646720764218754616478771584016748057 | -42.666467207642185 | 2.54616e-15 | 0.0001 | LULUS |
| B4.var.FCC.pool_c.M | FCC Grup C – energi & utilitas (M) | FCC!M129 | -0.00000000000000000000000000000000000003 | 0 | 3e-38 | 0.0001 | LULUS |
| B4.var.FCC.pool_d.F | FCC Grup D – mesin (F) | FCC!F130 | 907.352211890309509840749948295437758259 | 907.3522118903096 | 9.01593e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_d.G | FCC Grup D – mesin (G) | FCC!G130 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_d.H | FCC Grup D – mesin (H) | FCC!H130 | 907.352211890309509840749948295437758259 | 907.3522118903096 | 9.01593e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_d.I | FCC Grup D – mesin (I) | FCC!I130 | 998.0385340820795363894598667077489310873 | 998.0385340820795 | -3.63895e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_d.J | FCC Grup D – mesin (J) | FCC!J130 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_d.K | FCC Grup D – mesin (K) | FCC!K130 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_d.L | FCC Grup D – mesin (L) | FCC!L130 | -90.6863221917700265487099184123111728283 | -90.68632219176996 | 6.65487e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_d.M | FCC Grup D – mesin (M) | FCC!M130 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_e.F | FCC Grup E – pabrik umum (F) | FCC!F131 | 1073.275150804623780722006727924262313072 | 1073.2751508046238 | 1.9278e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_e.G | FCC Grup E – pabrik umum (G) | FCC!G131 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_e.H | FCC Grup E – pabrik umum (H) | FCC!H131 | 1073.275150804623780722006727924262313072 | 1073.2751508046238 | 1.9278e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_e.I | FCC Grup E – pabrik umum (I) | FCC!I131 | 1073.275150804623780722006727924262313072 | 1073.2751508046238 | 1.9278e-14 | 0.0001 | LULUS |
| B4.var.FCC.pool_e.J | FCC Grup E – pabrik umum (J) | FCC!J131 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_e.K | FCC Grup E – pabrik umum (K) | FCC!K131 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_e.L | FCC Grup E – pabrik umum (L) | FCC!L131 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.pool_e.M | FCC Grup E – pabrik umum (M) | FCC!M131 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.factory_overhead.F | FCC Overhead pabrik (F) | FCC!F132 | 3581.63304253684306715683998598700843734 | 3581.6330425368433 | 2.32843e-13 | 0.0001 | LULUS |
| B4.var.FCC.factory_overhead.G | FCC Overhead pabrik (G) | FCC!G132 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.factory_overhead.H | FCC Overhead pabrik (H) | FCC!H132 | 3581.63304253684306715683998598700843734 | 3581.6330425368433 | 2.32843e-13 | 0.0001 | LULUS |
| B4.var.FCC.factory_overhead.I | FCC Overhead pabrik (I) | FCC!I132 | 3981.567727338260363071546451800796039219 | 3981.56772733826 | -3.63072e-13 | 0.0001 | LULUS |
| B4.var.FCC.factory_overhead.J | FCC Overhead pabrik (J) | FCC!J132 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.factory_overhead.K | FCC Overhead pabrik (K) | FCC!K132 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.factory_overhead.L | FCC Overhead pabrik (L) | FCC!L132 | -399.9346848014172959147064658137876018791 | -399.93468480141723 | 6.59147e-14 | 0.0001 | LULUS |
| B4.var.FCC.factory_overhead.M | FCC Overhead pabrik (M) | FCC!M132 | 0.00000000000000000000000000000000000017 | 0 | -1.7e-37 | 0.0001 | LULUS |
| B4.var.FCC.total.F | FCC Total (F) | FCC!F133 | 23301.54101103618503480033597413505653735 | 23301.54101103618 | -5.0348e-12 | 0.0001 | LULUS |
| B4.var.FCC.total.G | FCC Total (G) | FCC!G133 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.total.H | FCC Total (H) | FCC!H133 | 23301.54101103618503480033597413505653735 | 23301.54101103618 | -5.0348e-12 | 0.0001 | LULUS |
| B4.var.FCC.total.I | FCC Total (I) | FCC!I133 | 23958.86932983898113084737142360274013076 | 23958.869329838977 | -4.13085e-12 | 0.0001 | LULUS |
| B4.var.FCC.total.J | FCC Total (J) | FCC!J133 | 40.79640591786711716464843008065911709712 | 40.79640591786712 | 2.83535e-15 | 0.0001 | LULUS |
| B4.var.FCC.total.K | FCC Total (K) | FCC!K133 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.FCC.total.L | FCC Total (L) | FCC!L133 | -698.1247247206625359293947822710332048809 | -698.1247247206625 | 3.59294e-14 | 0.0001 | LULUS |
| B4.var.FCC.total.M | FCC Total (M) | FCC!M133 | -0.000000000000677282289097277309505617979 | 0.00000000000005773159728050814 | 7.35014e-13 | 0.0001 | LULUS |
| B4.var.summary.FCC.B | RINGKASAN varian FCC (B) | RINGKASAN!B16 | 23301.54101103618503480033597413505653735 | 23301.54101103618 | -5.0348e-12 | 0.0001 | LULUS |
| B4.var.summary.FCC.C | RINGKASAN varian FCC (C) | RINGKASAN!C16 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.summary.FCC.D | RINGKASAN varian FCC (D) | RINGKASAN!D16 | 23301.54101103618503480033597413505653735 | 23301.54101103618 | -5.0348e-12 | 0.0001 | LULUS |
| B4.var.summary.FCC.E | RINGKASAN varian FCC (E) | RINGKASAN!E16 | 23958.86932983898113084737142360274013076 | 23958.869329838977 | -4.13085e-12 | 0.0001 | LULUS |
| B4.var.summary.FCC.F | RINGKASAN varian FCC (F) | RINGKASAN!F16 | 40.79640591786711716464843008065911709712 | 40.79640591786712 | 2.83535e-15 | 0.0001 | LULUS |
| B4.var.summary.FCC.G | RINGKASAN varian FCC (G) | RINGKASAN!G16 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.summary.FCC.H | RINGKASAN varian FCC (H) | RINGKASAN!H16 | -698.1247247206625359293947822710332048809 | -698.1247247206625 | 3.59294e-14 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.F | UU Ubi ungu (F) | UU!F104 | 17971.33689839572192513368983957219251337 | 17971.336898395723 | 1.07487e-12 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.G | UU Ubi ungu (G) | UU!G104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.H | UU Ubi ungu (H) | UU!H104 | 17971.33689839572192513368983957219251337 | 17971.336898395723 | 1.07487e-12 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.I | UU Ubi ungu (I) | UU!I104 | 17971.33689839572192513368983957219251337 | 17971.336898395723 | 1.07487e-12 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.J | UU Ubi ungu (J) | UU!J104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.K | UU Ubi ungu (K) | UU!K104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.L | UU Ubi ungu (L) | UU!L104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.M | UU Ubi ungu (M) | UU!M104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.B | UU Ubi ungu (B) | UU!B104 | 3.045989304812834224598930481283422459893 | 3.045989304812834 | -2.24599e-16 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.C | UU Ubi ungu (C) | UU!C104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.D | UU Ubi ungu (D) | UU!D104 | 5900 | 5900 | 0 | 0.0001 | LULUS |
| B4.var.UU.ubi_ungu.E | UU Ubi ungu (E) | UU!E104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.raw_materials.F | UU Bahan baku (F) | UU!F105 | 17971.33689839572192513368983957219251337 | 17971.336898395723 | 1.07487e-12 | 0.0001 | LULUS |
| B4.var.UU.raw_materials.G | UU Bahan baku (G) | UU!G105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.raw_materials.H | UU Bahan baku (H) | UU!H105 | 17971.33689839572192513368983957219251337 | 17971.336898395723 | 1.07487e-12 | 0.0001 | LULUS |
| B4.var.UU.raw_materials.I | UU Bahan baku (I) | UU!I105 | 17971.33689839572192513368983957219251337 | 17971.336898395723 | 1.07487e-12 | 0.0001 | LULUS |
| B4.var.UU.raw_materials.J | UU Bahan baku (J) | UU!J105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.raw_materials.K | UU Bahan baku (K) | UU!K105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.raw_materials.L | UU Bahan baku (L) | UU!L105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.raw_materials.M | UU Bahan baku (M) | UU!M105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.olein.F | UU Minyak olein (F) | UU!F106 | 4794.770346234332406417112299465240641711 | 4794.7703462343325 | 9.35829e-14 | 0.0001 | LULUS |
| B4.var.UU.olein.G | UU Minyak olein (G) | UU!G106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.olein.H | UU Minyak olein (H) | UU!H106 | 4794.770346234332406417112299465240641711 | 4794.7703462343325 | 9.35829e-14 | 0.0001 | LULUS |
| B4.var.UU.olein.I | UU Minyak olein (I) | UU!I106 | 4794.770346234332406417112299465240641711 | 4794.7703462343325 | 9.35829e-14 | 0.0001 | LULUS |
| B4.var.UU.olein.J | UU Minyak olein (J) | UU!J106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.olein.K | UU Minyak olein (K) | UU!K106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.olein.L | UU Minyak olein (L) | UU!L106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.olein.M | UU Minyak olein (M) | UU!M106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.olein.B | UU Minyak olein (B) | UU!B106 | 0.2737967914438502673796791443850267379679 | 0.2737967914438503 | 3.26203e-17 | 0.0001 | LULUS |
| B4.var.UU.olein.C | UU Minyak olein (C) | UU!C106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.olein.D | UU Minyak olein (D) | UU!D106 | 17512.1495067543 | 17512.1495067543 | 0 | 0.0001 | LULUS |
| B4.var.UU.olein.E | UU Minyak olein (E) | UU!E106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.oil.F | UU Minyak (F) | UU!F107 | 4794.770346234332406417112299465240641711 | 4794.7703462343325 | 9.35829e-14 | 0.0001 | LULUS |
| B4.var.UU.oil.G | UU Minyak (G) | UU!G107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.oil.H | UU Minyak (H) | UU!H107 | 4794.770346234332406417112299465240641711 | 4794.7703462343325 | 9.35829e-14 | 0.0001 | LULUS |
| B4.var.UU.oil.I | UU Minyak (I) | UU!I107 | 4794.770346234332406417112299465240641711 | 4794.7703462343325 | 9.35829e-14 | 0.0001 | LULUS |
| B4.var.UU.oil.J | UU Minyak (J) | UU!J107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.oil.K | UU Minyak (K) | UU!K107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.oil.L | UU Minyak (L) | UU!L107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.oil.M | UU Minyak (M) | UU!M107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.F | UU CNG (MMBTU) (F) | UU!F108 | 3087.064977079413262032085561497326203209 | 3087.0649770794134 | 1.37968e-13 | 0.0001 | LULUS |
| B4.var.UU.cng.G | UU CNG (MMBTU) (G) | UU!G108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.H | UU CNG (MMBTU) (H) | UU!H108 | 3087.064977079413262032085561497326203209 | 3087.0649770794134 | 1.37968e-13 | 0.0001 | LULUS |
| B4.var.UU.cng.I | UU CNG (MMBTU) (I) | UU!I108 | 3087.064977079413289078760334821775401069 | 3087.0649770794134 | 1.10921e-13 | 0.0001 | LULUS |
| B4.var.UU.cng.J | UU CNG (MMBTU) (J) | UU!J108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.K | UU CNG (MMBTU) (K) | UU!K108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.L | UU CNG (MMBTU) (L) | UU!L108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.M | UU CNG (MMBTU) (M) | UU!M108 | -0.00000000000002704667477332444919786 | 0 | 2.70467e-14 | 0.0001 | LULUS |
| B4.var.UU.cng.B | UU CNG (MMBTU) (B) | UU!B108 | 0.0136488717052568791443850267379679144385 | 0.013648871705256879 | -1.44385e-19 | 0.0001 | LULUS |
| B4.var.UU.cng.C | UU CNG (MMBTU) (C) | UU!C108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.D | UU CNG (MMBTU) (D) | UU!D108 | 226177.30195899098 | 226177.30195899098 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.E | UU CNG (MMBTU) (E) | UU!E108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.F | UU CNG (F) | UU!F109 | 3087.064977079413262032085561497326203209 | 3087.0649770794134 | 1.37968e-13 | 0.0001 | LULUS |
| B4.var.UU.cng.G | UU CNG (G) | UU!G109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.H | UU CNG (H) | UU!H109 | 3087.064977079413262032085561497326203209 | 3087.0649770794134 | 1.37968e-13 | 0.0001 | LULUS |
| B4.var.UU.cng.I | UU CNG (I) | UU!I109 | 3087.064977079413289078760334821775401069 | 3087.0649770794134 | 1.10921e-13 | 0.0001 | LULUS |
| B4.var.UU.cng.J | UU CNG (J) | UU!J109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.K | UU CNG (K) | UU!K109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.L | UU CNG (L) | UU!L109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.cng.M | UU CNG (M) | UU!M109 | -0.00000000000002704667477332444919786 | 0 | 2.70467e-14 | 0.0001 | LULUS |
| B4.var.UU.ammonium.F | UU Amonium bicarbonate (F) | UU!F110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.G | UU Amonium bicarbonate (G) | UU!G110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.H | UU Amonium bicarbonate (H) | UU!H110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.I | UU Amonium bicarbonate (I) | UU!I110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.J | UU Amonium bicarbonate (J) | UU!J110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.K | UU Amonium bicarbonate (K) | UU!K110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.L | UU Amonium bicarbonate (L) | UU!L110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.M | UU Amonium bicarbonate (M) | UU!M110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.B | UU Amonium bicarbonate (B) | UU!B110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.C | UU Amonium bicarbonate (C) | UU!C110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.D | UU Amonium bicarbonate (D) | UU!D110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.ammonium.E | UU Amonium bicarbonate (E) | UU!E110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.F | UU HDPE 0,03 (F) | UU!F111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.G | UU HDPE 0,03 (G) | UU!G111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.H | UU HDPE 0,03 (H) | UU!H111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.I | UU HDPE 0,03 (I) | UU!I111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.J | UU HDPE 0,03 (J) | UU!J111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.K | UU HDPE 0,03 (K) | UU!K111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.L | UU HDPE 0,03 (L) | UU!L111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.M | UU HDPE 0,03 (M) | UU!M111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.B | UU HDPE 0,03 (B) | UU!B111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.C | UU HDPE 0,03 (C) | UU!C111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.D | UU HDPE 0,03 (D) | UU!D111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_003.E | UU HDPE 0,03 (E) | UU!E111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.F | UU HDPE 0,06 (F) | UU!F112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.G | UU HDPE 0,06 (G) | UU!G112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.H | UU HDPE 0,06 (H) | UU!H112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.I | UU HDPE 0,06 (I) | UU!I112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.J | UU HDPE 0,06 (J) | UU!J112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.K | UU HDPE 0,06 (K) | UU!K112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.L | UU HDPE 0,06 (L) | UU!L112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.M | UU HDPE 0,06 (M) | UU!M112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.B | UU HDPE 0,06 (B) | UU!B112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.C | UU HDPE 0,06 (C) | UU!C112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.D | UU HDPE 0,06 (D) | UU!D112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_006.E | UU HDPE 0,06 (E) | UU!E112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.F | UU HDPE 0,07 (F) | UU!F113 | 697.6381006534417112299465240641711229947 | 697.6381006534417 | -1.12299e-14 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.G | UU HDPE 0,07 (G) | UU!G113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.H | UU HDPE 0,07 (H) | UU!H113 | 697.6381006534417112299465240641711229947 | 697.6381006534417 | -1.12299e-14 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.I | UU HDPE 0,07 (I) | UU!I113 | 697.6381006534417112299465240641711229945 | 697.6381006534416 | -1.1123e-13 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.J | UU HDPE 0,07 (J) | UU!J113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.K | UU HDPE 0,07 (K) | UU!K113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.L | UU HDPE 0,07 (L) | UU!L113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.M | UU HDPE 0,07 (M) | UU!M113 | 0.0000000000000000000000000000000000002 | 0.00000000000011368683772161603 | 1.13687e-13 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.B | UU HDPE 0,07 (B) | UU!B113 | 0.02139037433155080213903743315508021390374 | 0.0213903743315508 | -2.13904e-18 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.C | UU HDPE 0,07 (C) | UU!C113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.D | UU HDPE 0,07 (D) | UU!D113 | 32614.5812055484 | 32614.5812055484 | 0 | 0.0001 | LULUS |
| B4.var.UU.hdpe_007.E | UU HDPE 0,07 (E) | UU!E113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.F | UU Kemasan IFM (karton) (F) | UU!F114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.G | UU Kemasan IFM (karton) (G) | UU!G114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.H | UU Kemasan IFM (karton) (H) | UU!H114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.I | UU Kemasan IFM (karton) (I) | UU!I114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.J | UU Kemasan IFM (karton) (J) | UU!J114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.K | UU Kemasan IFM (karton) (K) | UU!K114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.L | UU Kemasan IFM (karton) (L) | UU!L114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.M | UU Kemasan IFM (karton) (M) | UU!M114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.B | UU Kemasan IFM (karton) (B) | UU!B114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.C | UU Kemasan IFM (karton) (C) | UU!C114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.D | UU Kemasan IFM (karton) (D) | UU!D114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.carton.E | UU Kemasan IFM (karton) (E) | UU!E114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.other.F | UU Biaya lain (plakban, tali, label, plastik) (F) | UU!F115 | 74.74981296046529197860962566844919786096 | 74.74981296046529 | -1.97861e-15 | 0.0001 | LULUS |
| B4.var.UU.other.G | UU Biaya lain (plakban, tali, label, plastik) (G) | UU!G115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.other.H | UU Biaya lain (plakban, tali, label, plastik) (H) | UU!H115 | 74.74981296046529197860962566844919786096 | 74.74981296046529 | -1.97861e-15 | 0.0001 | LULUS |
| B4.var.UU.other.I | UU Biaya lain (plakban, tali, label, plastik) (I) | UU!I115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.other.J | UU Biaya lain (plakban, tali, label, plastik) (J) | UU!J115 | 74.74981296046529197860962566844919786096 | 74.74981296046529 | -1.97861e-15 | 0.0001 | LULUS |
| B4.var.UU.other.K | UU Biaya lain (plakban, tali, label, plastik) (K) | UU!K115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.other.L | UU Biaya lain (plakban, tali, label, plastik) (L) | UU!L115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.other.M | UU Biaya lain (plakban, tali, label, plastik) (M) | UU!M115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.material_others.F | UU Material lain (F) | UU!F116 | 772.3879136139070032085561497326203208557 | 772.387913613907 | -3.20856e-15 | 0.0001 | LULUS |
| B4.var.UU.material_others.G | UU Material lain (G) | UU!G116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.material_others.H | UU Material lain (H) | UU!H116 | 772.3879136139070032085561497326203208557 | 772.387913613907 | -3.20856e-15 | 0.0001 | LULUS |
| B4.var.UU.material_others.I | UU Material lain (I) | UU!I116 | 697.6381006534417112299465240641711229945 | 697.6381006534416 | -1.1123e-13 | 0.0001 | LULUS |
| B4.var.UU.material_others.J | UU Material lain (J) | UU!J116 | 74.74981296046529197860962566844919786096 | 74.74981296046529 | -1.97861e-15 | 0.0001 | LULUS |
| B4.var.UU.material_others.K | UU Material lain (K) | UU!K116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.material_others.L | UU Material lain (L) | UU!L116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.material_others.M | UU Material lain (M) | UU!M116 | 0.0000000000000000000000000000000000002 | 0.00000000000011368683772161603 | 1.13687e-13 | 0.0001 | LULUS |
| B4.var.UU.peeling.F | UU Upah kupas (kg dikupas) (F) | UU!F117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.G | UU Upah kupas (kg dikupas) (G) | UU!G117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.H | UU Upah kupas (kg dikupas) (H) | UU!H117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.I | UU Upah kupas (kg dikupas) (I) | UU!I117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.J | UU Upah kupas (kg dikupas) (J) | UU!J117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.K | UU Upah kupas (kg dikupas) (K) | UU!K117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.L | UU Upah kupas (kg dikupas) (L) | UU!L117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.M | UU Upah kupas (kg dikupas) (M) | UU!M117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.B | UU Upah kupas (kg dikupas) (B) | UU!B117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.C | UU Upah kupas (kg dikupas) (C) | UU!C117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.D | UU Upah kupas (kg dikupas) (D) | UU!D117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.E | UU Upah kupas (kg dikupas) (E) | UU!E117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.F | UU Upah kupas (F) | UU!F118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.G | UU Upah kupas (G) | UU!G118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.H | UU Upah kupas (H) | UU!H118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.I | UU Upah kupas (I) | UU!I118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.J | UU Upah kupas (J) | UU!J118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.K | UU Upah kupas (K) | UU!K118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.L | UU Upah kupas (L) | UU!L118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.peeling.M | UU Upah kupas (M) | UU!M118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_a.F | UU Grup A – DL operator (F) | UU!F119 | 4227.133135493268449197860962566844919786 | 4227.133135493268 | -4.49198e-13 | 0.0001 | LULUS |
| B4.var.UU.pool_a.G | UU Grup A – DL operator (G) | UU!G119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_a.H | UU Grup A – DL operator (H) | UU!H119 | 4227.133135493268449197860962566844919786 | 4227.133135493268 | -4.49198e-13 | 0.0001 | LULUS |
| B4.var.UU.pool_a.I | UU Grup A – DL operator (I) | UU!I119 | 1922.585093165388021390374331550802139037 | 1922.585093165388 | -2.13904e-14 | 0.0001 | LULUS |
| B4.var.UU.pool_a.J | UU Grup A – DL operator (J) | UU!J119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_a.K | UU Grup A – DL operator (K) | UU!K119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_a.L | UU Grup A – DL operator (L) | UU!L119 | 2304.548042327880427807486631016042780749 | 2304.548042327881 | 5.72193e-13 | 0.0001 | LULUS |
| B4.var.UU.pool_a.M | UU Grup A – DL operator (M) | UU!M119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.direct_labour.F | UU Tenaga kerja langsung (F) | UU!F120 | 4227.133135493268449197860962566844919786 | 4227.133135493268 | -4.49198e-13 | 0.0001 | LULUS |
| B4.var.UU.direct_labour.G | UU Tenaga kerja langsung (G) | UU!G120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.direct_labour.H | UU Tenaga kerja langsung (H) | UU!H120 | 4227.133135493268449197860962566844919786 | 4227.133135493268 | -4.49198e-13 | 0.0001 | LULUS |
| B4.var.UU.direct_labour.I | UU Tenaga kerja langsung (I) | UU!I120 | 1922.585093165388021390374331550802139037 | 1922.585093165388 | -2.13904e-14 | 0.0001 | LULUS |
| B4.var.UU.direct_labour.J | UU Tenaga kerja langsung (J) | UU!J120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.direct_labour.K | UU Tenaga kerja langsung (K) | UU!K120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.direct_labour.L | UU Tenaga kerja langsung (L) | UU!L120 | 2304.548042327880427807486631016042780749 | 2304.548042327881 | 5.72193e-13 | 0.0001 | LULUS |
| B4.var.UU.direct_labour.M | UU Tenaga kerja langsung (M) | UU!M120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_b.F | UU Grup B – IDL (F) | UU!F121 | 3779.057019079490909090909090909090909091 | 3779.057019079491 | 9.09091e-14 | 0.0001 | LULUS |
| B4.var.UU.pool_b.G | UU Grup B – IDL (G) | UU!G121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_b.H | UU Grup B – IDL (H) | UU!H121 | 3779.057019079490909090909090909090909091 | 3779.057019079491 | 9.09091e-14 | 0.0001 | LULUS |
| B4.var.UU.pool_b.I | UU Grup B – IDL (I) | UU!I121 | 1718.791071447157219251336898395721925134 | 1718.7910714471573 | 8.07487e-14 | 0.0001 | LULUS |
| B4.var.UU.pool_b.J | UU Grup B – IDL (J) | UU!J121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_b.K | UU Grup B – IDL (K) | UU!K121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_b.L | UU Grup B – IDL (L) | UU!L121 | 2060.265947632333689839572192513368983957 | 2060.265947632334 | 3.1016e-13 | 0.0001 | LULUS |
| B4.var.UU.pool_b.M | UU Grup B – IDL (M) | UU!M121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_c.F | UU Grup C – energi & utilitas (F) | UU!F122 | 59.73643349770920855614973262032085561497 | 59.73643349770921 | 1.44385e-15 | 0.0001 | LULUS |
| B4.var.UU.pool_c.G | UU Grup C – energi & utilitas (G) | UU!G122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_c.H | UU Grup C – energi & utilitas (H) | UU!H122 | 59.73643349770920855614973262032085561497 | 59.73643349770921 | 1.44385e-15 | 0.0001 | LULUS |
| B4.var.UU.pool_c.I | UU Grup C – energi & utilitas (I) | UU!I122 | 191.4629710043997219251336898395721925134 | 191.46297100439972 | -1.92513e-15 | 0.0001 | LULUS |
| B4.var.UU.pool_c.J | UU Grup C – energi & utilitas (J) | UU!J122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_c.K | UU Grup C – energi & utilitas (K) | UU!K122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_c.L | UU Grup C – energi & utilitas (L) | UU!L122 | -131.7265375066905133689839572192513368984 | -131.7265375066905 | 1.3369e-14 | 0.0001 | LULUS |
| B4.var.UU.pool_c.M | UU Grup C – energi & utilitas (M) | UU!M122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_d.F | UU Grup D – mesin (F) | UU!F123 | 2699.090753570620320855614973262032085561 | 2699.0907535706206 | 2.79144e-13 | 0.0001 | LULUS |
| B4.var.UU.pool_d.G | UU Grup D – mesin (G) | UU!G123 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_d.H | UU Grup D – mesin (H) | UU!H123 | 2699.090753570620320855614973262032085561 | 2699.0907535706206 | 2.79144e-13 | 0.0001 | LULUS |
| B4.var.UU.pool_d.I | UU Grup D – mesin (I) | UU!I123 | 400.6765011144334545454545454545454545455 | 400.67650111443345 | -4.54545e-15 | 0.0001 | LULUS |
| B4.var.UU.pool_d.J | UU Grup D – mesin (J) | UU!J123 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_d.K | UU Grup D – mesin (K) | UU!K123 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_d.L | UU Grup D – mesin (L) | UU!L123 | 2298.414252456186866310160427807486631016 | 2298.414252456187 | 1.3369e-13 | 0.0001 | LULUS |
| B4.var.UU.pool_d.M | UU Grup D – mesin (M) | UU!M123 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_e.F | UU Grup E – pabrik umum (F) | UU!F124 | 1599.199534984923850267379679144385026738 | 1599.1995349849237 | -1.50267e-13 | 0.0001 | LULUS |
| B4.var.UU.pool_e.G | UU Grup E – pabrik umum (G) | UU!G124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_e.H | UU Grup E – pabrik umum (H) | UU!H124 | 1599.199534984923850267379679144385026738 | 1599.1995349849237 | -1.50267e-13 | 0.0001 | LULUS |
| B4.var.UU.pool_e.I | UU Grup E – pabrik umum (I) | UU!I124 | 1599.199534984923850267379679144385026738 | 1599.1995349849237 | -1.50267e-13 | 0.0001 | LULUS |
| B4.var.UU.pool_e.J | UU Grup E – pabrik umum (J) | UU!J124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_e.K | UU Grup E – pabrik umum (K) | UU!K124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_e.L | UU Grup E – pabrik umum (L) | UU!L124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.pool_e.M | UU Grup E – pabrik umum (M) | UU!M124 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.factory_overhead.F | UU Overhead pabrik (F) | UU!F125 | 8137.083741132744288770053475935828877005 | 8137.083741132745 | 7.1123e-13 | 0.0001 | LULUS |
| B4.var.UU.factory_overhead.G | UU Overhead pabrik (G) | UU!G125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.factory_overhead.H | UU Overhead pabrik (H) | UU!H125 | 8137.083741132744288770053475935828877005 | 8137.083741132745 | 7.1123e-13 | 0.0001 | LULUS |
| B4.var.UU.factory_overhead.I | UU Overhead pabrik (I) | UU!I125 | 3910.130078550914245989304812834224598931 | 3910.130078550914 | -2.45989e-13 | 0.0001 | LULUS |
| B4.var.UU.factory_overhead.J | UU Overhead pabrik (J) | UU!J125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.factory_overhead.K | UU Overhead pabrik (K) | UU!K125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.factory_overhead.L | UU Overhead pabrik (L) | UU!L125 | 4226.953662581830042780748663101604278075 | 4226.953662581831 | 9.57219e-13 | 0.0001 | LULUS |
| B4.var.UU.factory_overhead.M | UU Overhead pabrik (M) | UU!M125 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.total.F | UU Total (F) | UU!F126 | 38989.77701194938733475935828877005347595 | 38989.77701194939 | 2.66524e-12 | 0.0001 | LULUS |
| B4.var.UU.total.G | UU Total (G) | UU!G126 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.total.H | UU Total (H) | UU!H126 | 38989.77701194938733475935828877005347595 | 38989.77701194939 | 2.66524e-12 | 0.0001 | LULUS |
| B4.var.UU.total.I | UU Total (I) | UU!I126 | 32383.52549407921159923918814230840641711 | 32383.525494079207 | -4.59924e-12 | 0.0001 | LULUS |
| B4.var.UU.total.J | UU Total (J) | UU!J126 | 74.74981296046529197860962566844919786096 | 74.74981296046529 | -1.97861e-15 | 0.0001 | LULUS |
| B4.var.UU.total.K | UU Total (K) | UU!K126 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UU.total.L | UU Total (L) | UU!L126 | 6531.501704909710470588235294117647058824 | 6531.501704909711 | 5.29412e-13 | 0.0001 | LULUS |
| B4.var.UU.total.M | UU Total (M) | UU!M126 | -0.0000000000000270466747733244491978598 | 0.00000000000011368683772161603 | 1.40734e-13 | 0.0001 | LULUS |
| B4.var.summary.UU.B | RINGKASAN varian UU (B) | RINGKASAN!B17 | 38989.77701194938733475935828877005347595 | 38989.77701194939 | 2.66524e-12 | 0.0001 | LULUS |
| B4.var.summary.UU.C | RINGKASAN varian UU (C) | RINGKASAN!C17 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.summary.UU.D | RINGKASAN varian UU (D) | RINGKASAN!D17 | 38989.77701194938733475935828877005347595 | 38989.77701194939 | 2.66524e-12 | 0.0001 | LULUS |
| B4.var.summary.UU.E | RINGKASAN varian UU (E) | RINGKASAN!E17 | 32383.52549407921159923918814230840641711 | 32383.525494079207 | -4.59924e-12 | 0.0001 | LULUS |
| B4.var.summary.UU.F | RINGKASAN varian UU (F) | RINGKASAN!F17 | 74.74981296046529197860962566844919786096 | 74.74981296046529 | -1.97861e-15 | 0.0001 | LULUS |
| B4.var.summary.UU.G | RINGKASAN varian UU (G) | RINGKASAN!G17 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.summary.UU.H | RINGKASAN varian UU (H) | RINGKASAN!H17 | 6531.501704909710470588235294117647058824 | 6531.501704909711 | 5.29412e-13 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.F | UO Ubi orange (F) | UO!F100 | 16829.02241084058223512768967314421859876 | 16829.022410840582 | -2.35128e-13 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.G | UO Ubi orange (G) | UO!G100 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.H | UO Ubi orange (H) | UO!H100 | 16829.02241084058223512768967314421859876 | 16829.022410840582 | -2.35128e-13 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.I | UO Ubi orange (I) | UO!I100 | 16829.02241084058037674037674037674037674 | 16829.022410840582 | 1.62326e-12 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.J | UO Ubi orange (J) | UO!J100 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.K | UO Ubi orange (K) | UO!K100 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.L | UO Ubi orange (L) | UO!L100 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.M | UO Ubi orange (M) | UO!M100 | 0.00000000000185838731293276747822202 | 0 | -1.85839e-12 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.B | UO Ubi orange (B) | UO!B100 | 3.577991214354850718487082123445759809396 | 3.5779912143548507 | -1.84871e-17 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.C | UO Ubi orange (C) | UO!C100 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.D | UO Ubi orange (D) | UO!D100 | 4703.48343599134 | 4703.48343599134 | 0 | 0.0001 | LULUS |
| B4.var.UO.ubi_orange.E | UO Ubi orange (E) | UO!E100 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.raw_materials.F | UO Bahan baku (F) | UO!F101 | 16829.02241084058223512768967314421859876 | 16829.022410840582 | -2.35128e-13 | 0.0001 | LULUS |
| B4.var.UO.raw_materials.G | UO Bahan baku (G) | UO!G101 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.raw_materials.H | UO Bahan baku (H) | UO!H101 | 16829.02241084058223512768967314421859876 | 16829.022410840582 | -2.35128e-13 | 0.0001 | LULUS |
| B4.var.UO.raw_materials.I | UO Bahan baku (I) | UO!I101 | 16829.02241084058037674037674037674037674 | 16829.022410840582 | 1.62326e-12 | 0.0001 | LULUS |
| B4.var.UO.raw_materials.J | UO Bahan baku (J) | UO!J101 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.raw_materials.K | UO Bahan baku (K) | UO!K101 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.raw_materials.L | UO Bahan baku (L) | UO!L101 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.raw_materials.M | UO Bahan baku (M) | UO!M101 | 0.00000000000185838731293276747822202 | 0 | -1.85839e-12 | 0.0001 | LULUS |
| B4.var.UO.olein.F | UO Minyak olein (F) | UO!F102 | 4839.929935899930012657285384558111830839 | 4839.929935899931 | 9.87343e-13 | 0.0001 | LULUS |
| B4.var.UO.olein.G | UO Minyak olein (G) | UO!G102 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.olein.H | UO Minyak olein (H) | UO!H102 | 4839.929935899930012657285384558111830839 | 4839.929935899931 | 9.87343e-13 | 0.0001 | LULUS |
| B4.var.UO.olein.I | UO Minyak olein (I) | UO!I102 | 4839.929935899930131784677239222693768148 | 4839.92993589993 | -1.31785e-13 | 0.0001 | LULUS |
| B4.var.UO.olein.J | UO Minyak olein (J) | UO!J102 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.olein.K | UO Minyak olein (K) | UO!K102 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.olein.L | UO Minyak olein (L) | UO!L102 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.olein.M | UO Minyak olein (M) | UO!M102 | -0.000000000000119127391854664581937309 | 0.0000000000009094947017729282 | 1.02862e-12 | 0.0001 | LULUS |
| B4.var.UO.olein.B | UO Minyak olein (B) | UO!B102 | 0.2763755491028218300945573672846400119127 | 0.2763755491028218 | -3.00946e-17 | 0.0001 | LULUS |
| B4.var.UO.olein.C | UO Minyak olein (C) | UO!C102 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.olein.D | UO Minyak olein (D) | UO!D102 | 17512.1495067543 | 17512.1495067543 | 0 | 0.0001 | LULUS |
| B4.var.UO.olein.E | UO Minyak olein (E) | UO!E102 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.oil.F | UO Minyak (F) | UO!F103 | 4839.929935899930012657285384558111830839 | 4839.929935899931 | 9.87343e-13 | 0.0001 | LULUS |
| B4.var.UO.oil.G | UO Minyak (G) | UO!G103 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.oil.H | UO Minyak (H) | UO!H103 | 4839.929935899930012657285384558111830839 | 4839.929935899931 | 9.87343e-13 | 0.0001 | LULUS |
| B4.var.UO.oil.I | UO Minyak (I) | UO!I103 | 4839.929935899930131784677239222693768148 | 4839.92993589993 | -1.31785e-13 | 0.0001 | LULUS |
| B4.var.UO.oil.J | UO Minyak (J) | UO!J103 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.oil.K | UO Minyak (K) | UO!K103 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.oil.L | UO Minyak (L) | UO!L103 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.oil.M | UO Minyak (M) | UO!M103 | -0.000000000000119127391854664581937309 | 0.0000000000009094947017729282 | 1.02862e-12 | 0.0001 | LULUS |
| B4.var.UO.cng.F | UO CNG (MMBTU) (F) | UO!F104 | 3471.824065820476062839699203335566971931 | 3471.824065820476 | -6.28397e-14 | 0.0001 | LULUS |
| B4.var.UO.cng.G | UO CNG (MMBTU) (G) | UO!G104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.H | UO CNG (MMBTU) (H) | UO!H104 | 3471.824065820476062839699203335566971931 | 3471.824065820476 | -6.28397e-14 | 0.0001 | LULUS |
| B4.var.UO.cng.I | UO CNG (MMBTU) (I) | UO!I104 | 3471.824065820476073844819488934613952796 | 3471.824065820476 | -7.38448e-14 | 0.0001 | LULUS |
| B4.var.UO.cng.J | UO CNG (MMBTU) (J) | UO!J104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.K | UO CNG (MMBTU) (K) | UO!K104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.L | UO CNG (MMBTU) (L) | UO!L104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.M | UO CNG (MMBTU) (M) | UO!M104 | -0.000000000000011005120285599046980865 | 0 | 1.10051e-14 | 0.0001 | LULUS |
| B4.var.UO.cng.B | UO CNG (MMBTU) (B) | UO!B104 | 0.01535001096816498845953391407936862482317 | 0.015350010968164988 | -4.59534e-19 | 0.0001 | LULUS |
| B4.var.UO.cng.C | UO CNG (MMBTU) (C) | UO!C104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.D | UO CNG (MMBTU) (D) | UO!D104 | 226177.30195899098 | 226177.30195899098 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.E | UO CNG (MMBTU) (E) | UO!E104 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.F | UO CNG (F) | UO!F105 | 3471.824065820476062839699203335566971931 | 3471.824065820476 | -6.28397e-14 | 0.0001 | LULUS |
| B4.var.UO.cng.G | UO CNG (G) | UO!G105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.H | UO CNG (H) | UO!H105 | 3471.824065820476062839699203335566971931 | 3471.824065820476 | -6.28397e-14 | 0.0001 | LULUS |
| B4.var.UO.cng.I | UO CNG (I) | UO!I105 | 3471.824065820476073844819488934613952796 | 3471.824065820476 | -7.38448e-14 | 0.0001 | LULUS |
| B4.var.UO.cng.J | UO CNG (J) | UO!J105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.K | UO CNG (K) | UO!K105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.L | UO CNG (L) | UO!L105 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.cng.M | UO CNG (M) | UO!M105 | -0.000000000000011005120285599046980865 | 0 | 1.10051e-14 | 0.0001 | LULUS |
| B4.var.UO.ammonium.F | UO Amonium bicarbonate (F) | UO!F106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.G | UO Amonium bicarbonate (G) | UO!G106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.H | UO Amonium bicarbonate (H) | UO!H106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.I | UO Amonium bicarbonate (I) | UO!I106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.J | UO Amonium bicarbonate (J) | UO!J106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.K | UO Amonium bicarbonate (K) | UO!K106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.L | UO Amonium bicarbonate (L) | UO!L106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.M | UO Amonium bicarbonate (M) | UO!M106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.B | UO Amonium bicarbonate (B) | UO!B106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.C | UO Amonium bicarbonate (C) | UO!C106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.D | UO Amonium bicarbonate (D) | UO!D106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.ammonium.E | UO Amonium bicarbonate (E) | UO!E106 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.F | UO HDPE 0,03 (F) | UO!F107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.G | UO HDPE 0,03 (G) | UO!G107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.H | UO HDPE 0,03 (H) | UO!H107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.I | UO HDPE 0,03 (I) | UO!I107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.J | UO HDPE 0,03 (J) | UO!J107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.K | UO HDPE 0,03 (K) | UO!K107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.L | UO HDPE 0,03 (L) | UO!L107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.M | UO HDPE 0,03 (M) | UO!M107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.B | UO HDPE 0,03 (B) | UO!B107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.C | UO HDPE 0,03 (C) | UO!C107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.D | UO HDPE 0,03 (D) | UO!D107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_003.E | UO HDPE 0,03 (E) | UO!E107 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.F | UO HDPE 0,05 (F) | UO!F108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.G | UO HDPE 0,05 (G) | UO!G108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.H | UO HDPE 0,05 (H) | UO!H108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.I | UO HDPE 0,05 (I) | UO!I108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.J | UO HDPE 0,05 (J) | UO!J108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.K | UO HDPE 0,05 (K) | UO!K108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.L | UO HDPE 0,05 (L) | UO!L108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.M | UO HDPE 0,05 (M) | UO!M108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.B | UO HDPE 0,05 (B) | UO!B108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.C | UO HDPE 0,05 (C) | UO!C108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.D | UO HDPE 0,05 (D) | UO!D108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_005.E | UO HDPE 0,05 (E) | UO!E108 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.F | UO HDPE 0,07 (F) | UO!F109 | 660.4992992263542550815278088005360732633 | 660.4992992263542 | -5.50815e-14 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.G | UO HDPE 0,07 (G) | UO!G109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.H | UO HDPE 0,07 (H) | UO!H109 | 660.4992992263542550815278088005360732633 | 660.4992992263542 | -5.50815e-14 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.I | UO HDPE 0,07 (I) | UO!I109 | 660.4992992263543146452237361328270419178 | 660.4992992263543 | -1.46452e-14 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.J | UO HDPE 0,07 (J) | UO!J109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.K | UO HDPE 0,07 (K) | UO!K109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.L | UO HDPE 0,07 (L) | UO!L109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.M | UO HDPE 0,07 (M) | UO!M109 | -0.0000000000000595636959273322909686545 | -0.00000000000011368683772161603 | -5.41231e-14 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.B | UO HDPE 0,07 (B) | UO!B109 | 0.02025165661529297892934256570620206983843 | 0.02025165661529298 | 1.07066e-18 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.C | UO HDPE 0,07 (C) | UO!C109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.D | UO HDPE 0,07 (D) | UO!D109 | 32614.5812055484 | 32614.5812055484 | 0 | 0.0001 | LULUS |
| B4.var.UO.hdpe_007.E | UO HDPE 0,07 (E) | UO!E109 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.F | UO Kemasan IFM (karton) (F) | UO!F110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.G | UO Kemasan IFM (karton) (G) | UO!G110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.H | UO Kemasan IFM (karton) (H) | UO!H110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.I | UO Kemasan IFM (karton) (I) | UO!I110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.J | UO Kemasan IFM (karton) (J) | UO!J110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.K | UO Kemasan IFM (karton) (K) | UO!K110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.L | UO Kemasan IFM (karton) (L) | UO!L110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.M | UO Kemasan IFM (karton) (M) | UO!M110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.B | UO Kemasan IFM (karton) (B) | UO!B110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.C | UO Kemasan IFM (karton) (C) | UO!C110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.D | UO Kemasan IFM (karton) (D) | UO!D110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.carton.E | UO Kemasan IFM (karton) (E) | UO!E110 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.other.F | UO Biaya lain (plakban, tali, label, plastik) (F) | UO!F111 | 49.47288377975884148611421338694065966793 | 49.47288377975884 | -1.48611e-15 | 0.0001 | LULUS |
| B4.var.UO.other.G | UO Biaya lain (plakban, tali, label, plastik) (G) | UO!G111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.other.H | UO Biaya lain (plakban, tali, label, plastik) (H) | UO!H111 | 49.47288377975884148611421338694065966793 | 49.47288377975884 | -1.48611e-15 | 0.0001 | LULUS |
| B4.var.UO.other.I | UO Biaya lain (plakban, tali, label, plastik) (I) | UO!I111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.other.J | UO Biaya lain (plakban, tali, label, plastik) (J) | UO!J111 | 49.47288377975884148611421338694065966793 | 49.47288377975884 | -1.48611e-15 | 0.0001 | LULUS |
| B4.var.UO.other.K | UO Biaya lain (plakban, tali, label, plastik) (K) | UO!K111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.other.L | UO Biaya lain (plakban, tali, label, plastik) (L) | UO!L111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.other.M | UO Biaya lain (plakban, tali, label, plastik) (M) | UO!M111 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.material_others.F | UO Material lain (F) | UO!F112 | 709.9721830061130965676420221874767329312 | 709.972183006113 | -9.65676e-14 | 0.0001 | LULUS |
| B4.var.UO.material_others.G | UO Material lain (G) | UO!G112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.material_others.H | UO Material lain (H) | UO!H112 | 709.9721830061130965676420221874767329312 | 709.972183006113 | -9.65676e-14 | 0.0001 | LULUS |
| B4.var.UO.material_others.I | UO Material lain (I) | UO!I112 | 660.4992992263543146452237361328270419178 | 660.4992992263543 | -1.46452e-14 | 0.0001 | LULUS |
| B4.var.UO.material_others.J | UO Material lain (J) | UO!J112 | 49.47288377975884148611421338694065966793 | 49.47288377975884 | -1.48611e-15 | 0.0001 | LULUS |
| B4.var.UO.material_others.K | UO Material lain (K) | UO!K112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.material_others.L | UO Material lain (L) | UO!L112 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.material_others.M | UO Material lain (M) | UO!M112 | -0.0000000000000595636959273322909686545 | -0.00000000000011368683772161603 | -5.41231e-14 | 0.0001 | LULUS |
| B4.var.UO.peeling.F | UO Upah kupas (kg dikupas) (F) | UO!F113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.G | UO Upah kupas (kg dikupas) (G) | UO!G113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.H | UO Upah kupas (kg dikupas) (H) | UO!H113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.I | UO Upah kupas (kg dikupas) (I) | UO!I113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.J | UO Upah kupas (kg dikupas) (J) | UO!J113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.K | UO Upah kupas (kg dikupas) (K) | UO!K113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.L | UO Upah kupas (kg dikupas) (L) | UO!L113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.M | UO Upah kupas (kg dikupas) (M) | UO!M113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.B | UO Upah kupas (kg dikupas) (B) | UO!B113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.C | UO Upah kupas (kg dikupas) (C) | UO!C113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.D | UO Upah kupas (kg dikupas) (D) | UO!D113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.E | UO Upah kupas (kg dikupas) (E) | UO!E113 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.F | UO Upah kupas (F) | UO!F114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.G | UO Upah kupas (G) | UO!G114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.H | UO Upah kupas (H) | UO!H114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.I | UO Upah kupas (I) | UO!I114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.J | UO Upah kupas (J) | UO!J114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.K | UO Upah kupas (K) | UO!K114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.L | UO Upah kupas (L) | UO!L114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.peeling.M | UO Upah kupas (M) | UO!M114 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_a.F | UO Grup A – DL operator (F) | UO!F115 | 3586.239931395388280842826297371751917206 | 3586.2399313953883 | 1.91572e-14 | 0.0001 | LULUS |
| B4.var.UO.pool_a.G | UO Grup A – DL operator (G) | UO!G115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_a.H | UO Grup A – DL operator (H) | UO!H115 | 3586.239931395388280842826297371751917206 | 3586.2399313953883 | 1.91572e-14 | 0.0001 | LULUS |
| B4.var.UO.pool_a.I | UO Grup A – DL operator (I) | UO!I115 | 1922.585093165387983024346660710297073933 | 1922.5850931653881 | 1.16976e-13 | 0.0001 | LULUS |
| B4.var.UO.pool_a.J | UO Grup A – DL operator (J) | UO!J115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_a.K | UO Grup A – DL operator (K) | UO!K115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_a.L | UO Grup A – DL operator (L) | UO!L115 | 1663.654838230000297818479636661454843273 | 1663.6548382300002 | -9.78185e-14 | 0.0001 | LULUS |
| B4.var.UO.pool_a.M | UO Grup A – DL operator (M) | UO!M115 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.direct_labour.F | UO Tenaga kerja langsung (F) | UO!F116 | 3586.239931395388280842826297371751917206 | 3586.2399313953883 | 1.91572e-14 | 0.0001 | LULUS |
| B4.var.UO.direct_labour.G | UO Tenaga kerja langsung (G) | UO!G116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.direct_labour.H | UO Tenaga kerja langsung (H) | UO!H116 | 3586.239931395388280842826297371751917206 | 3586.2399313953883 | 1.91572e-14 | 0.0001 | LULUS |
| B4.var.UO.direct_labour.I | UO Tenaga kerja langsung (I) | UO!I116 | 1922.585093165387983024346660710297073933 | 1922.5850931653881 | 1.16976e-13 | 0.0001 | LULUS |
| B4.var.UO.direct_labour.J | UO Tenaga kerja langsung (J) | UO!J116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.direct_labour.K | UO Tenaga kerja langsung (K) | UO!K116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.direct_labour.L | UO Tenaga kerja langsung (L) | UO!L116 | 1663.654838230000297818479636661454843273 | 1663.6548382300002 | -9.78185e-14 | 0.0001 | LULUS |
| B4.var.UO.direct_labour.M | UO Tenaga kerja langsung (M) | UO!M116 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_b.F | UO Grup B – IDL (F) | UO!F117 | 3206.098495230248976248976248976248976249 | 3206.098495230249 | 2.3751e-14 | 0.0001 | LULUS |
| B4.var.UO.pool_b.G | UO Grup B – IDL (G) | UO!G117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_b.H | UO Grup B – IDL (H) | UO!H117 | 3206.098495230248976248976248976248976249 | 3206.098495230249 | 2.3751e-14 | 0.0001 | LULUS |
| B4.var.UO.pool_b.I | UO Grup B – IDL (I) | UO!I117 | 1718.791071447157322611868066413520958976 | 1718.7910714471573 | -2.26119e-14 | 0.0001 | LULUS |
| B4.var.UO.pool_b.J | UO Grup B – IDL (J) | UO!J117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_b.K | UO Grup B – IDL (K) | UO!K117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_b.L | UO Grup B – IDL (L) | UO!L117 | 1487.307423783091653637108182562728017273 | 1487.3074237830917 | 4.63629e-14 | 0.0001 | LULUS |
| B4.var.UO.pool_b.M | UO Grup B – IDL (M) | UO!M117 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_c.F | UO Grup C – energi & utilitas (F) | UO!F118 | 73.91740043525301168937532573896210259847 | 73.91740043525301 | -1.68938e-15 | 0.0001 | LULUS |
| B4.var.UO.pool_c.G | UO Grup C – energi & utilitas (G) | UO!G118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_c.H | UO Grup C – energi & utilitas (H) | UO!H118 | 73.91740043525301168937532573896210259847 | 73.91740043525301 | -1.68938e-15 | 0.0001 | LULUS |
| B4.var.UO.pool_c.I | UO Grup C – energi & utilitas (I) | UO!I118 | 191.4629710043997468542923088377633832179 | 191.46297100439975 | 3.14571e-15 | 0.0001 | LULUS |
| B4.var.UO.pool_c.J | UO Grup C – energi & utilitas (J) | UO!J118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_c.K | UO Grup C – energi & utilitas (K) | UO!K118 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_c.L | UO Grup C – energi & utilitas (L) | UO!L118 | -117.5455705691467351649169830988012806195 | -117.54557056914673 | 5.16492e-15 | 0.0001 | LULUS |
| B4.var.UO.pool_c.M | UO Grup C – energi & utilitas (M) | UO!M118 | 0.0000000000000000000000000000000000001 | 0 | -1e-37 | 0.0001 | LULUS |
| B4.var.UO.pool_d.F | UO Grup D – mesin (F) | UO!F119 | 3339.834006836367508003871640235276598913 | 3339.8340068363677 | 1.91996e-13 | 0.0001 | LULUS |
| B4.var.UO.pool_d.G | UO Grup D – mesin (G) | UO!G119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_d.H | UO Grup D – mesin (H) | UO!H119 | 3339.834006836367508003871640235276598913 | 3339.8340068363677 | 1.91996e-13 | 0.0001 | LULUS |
| B4.var.UO.pool_d.I | UO Grup D – mesin (I) | UO!I119 | 495.7940011434971334971334971334971334971 | 495.7940011434971 | -3.34971e-14 | 0.0001 | LULUS |
| B4.var.UO.pool_d.J | UO Grup D – mesin (J) | UO!J119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_d.K | UO Grup D – mesin (K) | UO!K119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_d.L | UO Grup D – mesin (L) | UO!L119 | 2844.040005692870374506738143101779465416 | 2844.0400056928706 | 2.25493e-13 | 0.0001 | LULUS |
| B4.var.UO.pool_d.M | UO Grup D – mesin (M) | UO!M119 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_e.F | UO Grup E – pabrik umum (F) | UO!F120 | 1552.662363643490283672101853920035738218 | 1552.6623636434904 | 1.16328e-13 | 0.0001 | LULUS |
| B4.var.UO.pool_e.G | UO Grup E – pabrik umum (G) | UO!G120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_e.H | UO Grup E – pabrik umum (H) | UO!H120 | 1552.662363643490283672101853920035738218 | 1552.6623636434904 | 1.16328e-13 | 0.0001 | LULUS |
| B4.var.UO.pool_e.I | UO Grup E – pabrik umum (I) | UO!I120 | 1552.662363643490283672101853920035738218 | 1552.6623636434904 | 1.16328e-13 | 0.0001 | LULUS |
| B4.var.UO.pool_e.J | UO Grup E – pabrik umum (J) | UO!J120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_e.K | UO Grup E – pabrik umum (K) | UO!K120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_e.L | UO Grup E – pabrik umum (L) | UO!L120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.pool_e.M | UO Grup E – pabrik umum (M) | UO!M120 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.factory_overhead.F | UO Overhead pabrik (F) | UO!F121 | 8172.512266145359779614325068870523415978 | 8172.512266145361 | 1.22039e-12 | 0.0001 | LULUS |
| B4.var.UO.factory_overhead.G | UO Overhead pabrik (G) | UO!G121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.factory_overhead.H | UO Overhead pabrik (H) | UO!H121 | 8172.512266145359779614325068870523415978 | 8172.512266145361 | 1.22039e-12 | 0.0001 | LULUS |
| B4.var.UO.factory_overhead.I | UO Overhead pabrik (I) | UO!I121 | 3958.710407238544486635395726304817213909 | 3958.7104072385446 | 1.13365e-13 | 0.0001 | LULUS |
| B4.var.UO.factory_overhead.J | UO Overhead pabrik (J) | UO!J121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.factory_overhead.K | UO Overhead pabrik (K) | UO!K121 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.factory_overhead.L | UO Overhead pabrik (L) | UO!L121 | 4213.80185890681529297892934256570620207 | 4213.801858906816 | 7.07021e-13 | 0.0001 | LULUS |
| B4.var.UO.factory_overhead.M | UO Overhead pabrik (M) | UO!M121 | 0.0000000000000000000000000000000000001 | 0 | -1e-37 | 0.0001 | LULUS |
| B4.var.UO.total.F | UO Total (F) | UO!F122 | 37609.50079310784946764946764946764946765 | 37609.50079310786 | 1.05324e-11 | 0.0001 | LULUS |
| B4.var.UO.total.G | UO Total (G) | UO!G122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.total.H | UO Total (H) | UO!H122 | 37609.50079310784946764946764946764946765 | 37609.50079310786 | 1.05324e-11 | 0.0001 | LULUS |
| B4.var.UO.total.I | UO Total (I) | UO!I122 | 31682.57121219127336667483959168198942745 | 31682.571212191277 | 3.63333e-12 | 0.0001 | LULUS |
| B4.var.UO.total.J | UO Total (J) | UO!J122 | 49.47288377975884148611421338694065966793 | 49.47288377975884 | -1.48611e-15 | 0.0001 | LULUS |
| B4.var.UO.total.K | UO Total (K) | UO!K122 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.UO.total.L | UO Total (L) | UO!L122 | 5877.456697136815590797408979227161045343 | 5877.456697136817 | 1.4092e-12 | 0.0001 | LULUS |
| B4.var.UO.total.M | UO Total (M) | UO!M122 | 0.0000000000016686911048651715583351916 | 0.0000000000007958078640513122 | -8.72883e-13 | 0.0001 | LULUS |
| B4.var.summary.UO.B | RINGKASAN varian UO (B) | RINGKASAN!B18 | 37609.50079310784946764946764946764946765 | 37609.50079310786 | 1.05324e-11 | 0.0001 | LULUS |
| B4.var.summary.UO.C | RINGKASAN varian UO (C) | RINGKASAN!C18 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.summary.UO.D | RINGKASAN varian UO (D) | RINGKASAN!D18 | 37609.50079310784946764946764946764946765 | 37609.50079310786 | 1.05324e-11 | 0.0001 | LULUS |
| B4.var.summary.UO.E | RINGKASAN varian UO (E) | RINGKASAN!E18 | 31682.57121219127336667483959168198942745 | 31682.571212191277 | 3.63333e-12 | 0.0001 | LULUS |
| B4.var.summary.UO.F | RINGKASAN varian UO (F) | RINGKASAN!F18 | 49.47288377975884148611421338694065966793 | 49.47288377975884 | -1.48611e-15 | 0.0001 | LULUS |
| B4.var.summary.UO.G | RINGKASAN varian UO (G) | RINGKASAN!G18 | 0 | 0 | 0 | 0.0001 | LULUS |
| B4.var.summary.UO.H | RINGKASAN varian UO (H) | RINGKASAN!H18 | 5877.456697136815590797408979227161045343 | 5877.456697136817 | 1.4092e-12 | 0.0001 | LULUS |
| B4.bridge.RA | Pendapatan Agu | BRIDGE GP!C111 | 9793.125452 | 9793.125452 | 0 | 0.000001 | LULUS |
| B4.bridge.RS | Pendapatan Sep | BRIDGE GP!C112 | 7462.3601526600005 | 7462.3601526600005 | 0 | 0.000001 | LULUS |
| B4.bridge.Ra | Pendapatan Sep pada harga Agu | BRIDGE GP!C113 | 7516.06860868389941219730576696105164625 | 7516.068608683899 | -4.12197e-13 | 0.000001 | LULUS |
| B4.bridge.mA | Margin GL Agu | BRIDGE GP!C114 | 0.1992193143611329283316527047385770587186 | 0.19921931436113294 | 1.16683e-17 | 0.000001 | LULUS |
| B4.bridge.mS | Margin GL Sep | BRIDGE GP!C115 | 0.1456573826582936752657599210949689927532 | 0.14565738265829364 | -3.52658e-17 | 0.000001 | LULUS |
| B4.bridge.start | Margin GL Agustus 2026 (pp) | BRIDGE GP!C117 | 19.92193143611329283316527047385770587186 | 19.921931436113294 | 1.16683e-15 | 0.0001 | LULUS |
| B4.bridge.b1 | Harga jual rata-rata | BRIDGE GP!C118 | -0.61049765884021771298990677961863897225 | -0.6104976588402145 | 3.21299e-15 | 0.0001 | LULUS |
| B4.bridge.b2 | Volume dan mix produksi | BRIDGE GP!C119 | 8.68000813612711513992583114236087998241 | 8.680008136127093 | -2.21399e-14 | 0.0001 | LULUS |
| B4.bridge.b3 | FCC: tarif singkong | BRIDGE GP!C120 | -1.850195922237449760494956859311881558854 | -1.8501959222374489 | 8.60495e-16 | 0.0001 | LULUS |
| B4.bridge.b4 | FCC: ongkos kirim singkong | BRIDGE GP!C121 | 0.2569055871210969803371929672329967347611 | 0.2569055871210971 | 1.19663e-16 | 0.0001 | LULUS |
| B4.bridge.b5 | FCC: minyak olein | BRIDGE GP!C122 | -0.808323162168775189467059132978837656027 | -0.8083231621687755 | -3.10533e-16 | 0.0001 | LULUS |
| B4.bridge.b6 | FCC: CNG | BRIDGE GP!C123 | 0.4567249232321317490852811805783995791961 | 0.4567249232321309 | -8.49085e-16 | 0.0001 | LULUS |
| B4.bridge.b7 | FCC: material lain | BRIDGE GP!C124 | 1.000802237740895391716475781193803752734 | 1.0008022377408954 | 8.28352e-18 | 0.0001 | LULUS |
| B4.bridge.b8 | FCC: tarif konversi variabel | BRIDGE GP!C125 | -0.8087888573971837155599154139652637457082 | -0.8087888573971849 | -1.18444e-15 | 0.0001 | LULUS |
| B4.bridge.b9 | UU, UO, Lain-lain: tarif | BRIDGE GP!C126 | -0.7491198121332556111714899323019928902365 | -0.7491198121332552 | 4.11171e-16 | 0.0001 | LULUS |
| B4.bridge.b10 | Biaya tetap: efek volume | BRIDGE GP!C127 | -2.433923490174819121711587958610975570936 | -2.4339234901748203 | -1.17829e-15 | 0.0001 | LULUS |
| B4.bridge.b11 | Biaya tetap: perubahan belanja | BRIDGE GP!C128 | -0.260268821919643828419656156605371490696 | -0.26026882191964046 | 3.36842e-15 | 0.0001 | LULUS |
| B4.bridge.b12 | Perubahan persediaan, KW 2, transfer | BRIDGE GP!C129 | -8.534203367636791679787179699820591985516 | -8.534203367636806 | -1.43202e-14 | 0.0001 | LULUS |
| B4.bridge.b13 | GL: material GL vs kartu | BRIDGE GP!C130 | 0.7710664743713342459459076802461265366755 | 0.7710664743713345 | 2.54054e-16 | 0.0001 | LULUS |
| B4.bridge.b14 | GL: beda penilaian persediaan WP vs Accurate | BRIDGE GP!C131 | 0.5805588534295470632154933733139826405418 | 0.5805588534295468 | -2.63215e-16 | 0.0001 | LULUS |
| B4.bridge.b15 | GL: KW 2 pada NRV | BRIDGE GP!C132 | 0.5477463381875245142274020082814001405862 | 0.5477463381875245 | -1.42274e-17 | 0.0001 | LULUS |
| B4.bridge.b16 | GL: biaya pabrik di opex | BRIDGE GP!C133 | 0.258932290421587331336582633203141349281 | 0.25893229042158755 | 2.18663e-16 | 0.0001 | LULUS |
| B4.bridge.b17 | GL: waktu pencatatan (THR tertukar, tali asih) | BRIDGE GP!C134 | -1.853616832634191196400541147651270954999 | -1.8536168326341913 | -1.03599e-16 | 0.0001 | LULUS |
| B4.bridge.end | Margin GL September 2026 (pp) | BRIDGE GP!C135 | 14.56573835160219743295314415940361176282 | 14.565738351602166 | -3.1433e-14 | 0.0001 | LULUS |
| B4.bridge.group.Harga | Kelompok Harga | BRIDGE GP!C138 | -0.61049765884021771298990677961863897225 | -0.6104976588402145 | 3.21299e-15 | 0.0001 | LULUS |
| B4.bridge.group.Volume & persediaan | Kelompok Volume & persediaan | BRIDGE GP!C139 | 0.145804768490323460138651442540287996894 | 0.14580476849028656 | -3.69001e-14 | 0.0001 | LULUS |
| B4.bridge.group.Tarif variabel | Kelompok Tarif variabel | BRIDGE GP!C140 | -2.501995005842540155554471409552775784135 | -2.5019950058425406 | -4.44446e-16 | 0.0001 | LULUS |
| B4.bridge.group.Tetap | Kelompok Tetap | BRIDGE GP!C141 | -2.694192312094462950131244115216347061632 | -2.6941923120944606 | 2.35013e-15 | 0.0001 | LULUS |
| B4.bridge.group.GL lain | Kelompok GL lain | BRIDGE GP!C142 | 2.158303956409993154725385695044650667084 | 2.1583039564099935 | 3.45275e-16 | 0.0001 | LULUS |
| B4.bridge.group.Waktu pencatatan | Kelompok Waktu pencatatan | BRIDGE GP!C143 | -1.853616832634191196400541147651270954999 | -1.8536168326341913 | -1.03599e-16 | 0.0001 | LULUS |
| B4.bridge.total_change | Total perubahan margin | BRIDGE GP!C144 | -5.356193084511095400212126314454094109038 | -5.356193084511127 | -3.15998e-14 | 0.0001 | LULUS |
| B4.bridge.check.margin_prior | Margin bulan lalu (bridge) = 1 − HPP GL ÷ pendapatan GL | BRIDGE GP!C151 | 0 | 0 | 0 | 0.0000001 | LULUS |
| B4.bridge.check.margin_current_lk | Margin bulan ini (bridge) = laba rugi LK (pp) | BRIDGE GP!C152 | 0.00000008577283563072306851690490459563 | 0.00000008577281285226945 | -2.27785e-14 | 0.000001 | LULUS |
| B4.bridge.check.bars_sum | Σ bar = margin bulan ini − margin bulan lalu (pp) | BRIDGE GP!C153 | 0.000000085772829906377152049906712487502 | 0.00000008577280219412842 | -2.77122e-14 | 0.000001 | LULUS |
| B4.bridge.check.components_prior | Komponen bulan lalu = HPP GL | BRIDGE GP!C154 | -0.000001 | -0.000000999999429041054 | 5.70959e-13 | 0.001 | LULUS |
| B4.bridge.check.components_current | Komponen bulan ini = HPP GL | BRIDGE GP!C155 | -0.000007214228738 | -0.0000072142292992793955 | -5.61279e-13 | 0.001 | LULUS |
| B4.bridge.check.fixed_vs_pools | Biaya tetap bulan ini = Σ bagian tetap pool | BRIDGE GP!C156 | -0.000000000000051360247111843293647284 | 0 | 5.13602e-14 | 0.001 | LULUS |
| B4.bridge.check.revenue_vs_gl | Pendapatan input = GL | BRIDGE GP!C157 | 0.0000000000005 | 0 | -5e-13 | 0.001 | LULUS |
| B4.bridge.comp.C81 | Komponen HPP Agu C81 | BRIDGE GP!C81 | 0.1920656267129379376965190546690714327907 | 0.19206562671293795 | 1.23035e-17 | 0.000001 | LULUS |
| B4.bridge.comp.C82 | Komponen HPP Agu C82 | BRIDGE GP!C82 | 0 | 0 | 0 | 0.000001 | LULUS |
| B4.bridge.comp.C83 | Komponen HPP Agu C83 | BRIDGE GP!C83 | 0.6484769526655308933027461431073107057629 | 0.6484769526655308 | -9.33027e-17 | 0.000001 | LULUS |
| B4.bridge.comp.C84 | Komponen HPP Agu C84 | BRIDGE GP!C84 | 0 | 0 | 0 | 0.000001 | LULUS |
| B4.bridge.comp.C85 | Komponen HPP Agu C85 | BRIDGE GP!C85 | 0.5895718656361903703147643980257672557695 | 0.5895718656361904 | 2.96852e-17 | 0.000001 | LULUS |
| B4.bridge.comp.C86 | Komponen HPP Agu C86 | BRIDGE GP!C86 | 0.9652735406202845973777170972650733439575 | 0.9652735406202847 | 1.02622e-16 | 0.000001 | LULUS |
| B4.bridge.comp.C87 | Komponen HPP Agu C87 | BRIDGE GP!C87 | 790.7211992743674006725741346990906392161 | 790.7211992743675 | 9.93274e-14 | 0.000001 | LULUS |
| B4.bridge.comp.C88 | Komponen HPP Agu C88 | BRIDGE GP!C88 | 668.8381187256325993274258653009093607839 | 668.8381187256326 | 6.72574e-16 | 0.000001 | LULUS |
| B4.bridge.comp.C89 | Komponen HPP Agu C89 | BRIDGE GP!C89 | 6802.461740274367400672574134699090639216 | 6802.461740274368 | 5.99327e-13 | 0.000001 | LULUS |
| B4.bridge.comp.C90 | Komponen HPP Agu C90 | BRIDGE GP!C90 | 56.51087708743546753253875433205547309351 | 56.51087708743547 | 2.46746e-15 | 0.000001 | LULUS |
| B4.bridge.comp.C91 | Komponen HPP Agu C91 | BRIDGE GP!C91 | 56.45218091256453246746124566794452690649 | 56.452180912564536 | 3.53254e-15 | 0.000001 | LULUS |
| B4.bridge.comp.C92 | Komponen HPP Agu C92 | BRIDGE GP!C92 | 436.1970870874354675325387543320554730935 | 436.1970870874355 | 3.24675e-14 | 0.000001 | LULUS |
| B4.bridge.comp.C93 | Komponen HPP Agu C93 | BRIDGE GP!C93 | 30.83869038594476567844472144892217084328 | 30.83869038594477 | 4.32156e-15 | 0.000001 | LULUS |
| B4.bridge.comp.C94 | Komponen HPP Agu C94 | BRIDGE GP!C94 | 30.76211261405523432155527855107782915672 | 30.762112614055237 | 2.67844e-15 | 0.000001 | LULUS |
| B4.bridge.comp.C95 | Komponen HPP Agu C95 | BRIDGE GP!C95 | 224.0853593859447656784447214489221708433 | 224.08535938594477 | 4.32156e-15 | 0.000001 | LULUS |
| B4.bridge.comp.C96 | Komponen HPP Agu C96 | BRIDGE GP!C96 | 41.4512068547461271931899569016863734904 | 41.45120685474613 | 2.80681e-15 | 0.000001 | LULUS |
| B4.bridge.comp.C97 | Komponen HPP Agu C97 | BRIDGE GP!C97 | 30.7127181452538728068100430983136265096 | 30.712718145253874 | 1.19319e-15 | 0.000001 | LULUS |
| B4.bridge.comp.C98 | Komponen HPP Agu C98 | BRIDGE GP!C98 | 54.0848068547461271931899569016863734904 | 54.084806854746134 | 6.80681e-15 | 0.000001 | LULUS |
| B4.bridge.comp.C99 | Komponen HPP Agu C99 | BRIDGE GP!C99 | 7516.828993602493761076747567381754656643 | 7516.828993602494 | 2.38923e-13 | 0.000001 | LULUS |
| B4.bridge.comp.C100 | Komponen HPP Agu C100 | BRIDGE GP!C100 | 786.7651303975062389232524326182453433567 | 786.7651303975064 | 1.61077e-13 | 0.000001 | LULUS |
| B4.bridge.comp.C101 | Komponen HPP Agu C101 | BRIDGE GP!C101 | -376.9462059999999999999999999999999999997 | -376.94620600000064 | -6.4e-13 | 0.000001 | LULUS |
| B4.bridge.comp.C102 | Komponen HPP Agu C102 | BRIDGE GP!C102 | 36.772823 | 36.77282300000002 | 2e-14 | 0.000001 | LULUS |
| B4.bridge.comp.C103 | Komponen HPP Agu C103 | BRIDGE GP!C103 | 45.583201 | 45.583200999999946 | -5.4e-14 | 0.000001 | LULUS |
| B4.bridge.comp.C104 | Komponen HPP Agu C104 | BRIDGE GP!C104 | 20.289793 | 20.289793 | 0 | 0.000001 | LULUS |
| B4.bridge.comp.C105 | Komponen HPP Agu C105 | BRIDGE GP!C105 | -116.503292 | -116.503292 | 0 | 0.000001 | LULUS |
| B4.bridge.comp.C106 | Komponen HPP Agu C106 | BRIDGE GP!C106 | -70.64473 | -70.64473000000001 | -1e-14 | 0.000001 | LULUS |
| B4.bridge.comp.C107 | Komponen HPP Agu C107 | BRIDGE GP!C107 | -0.000001 | -0.000000999999429041054 | 5.70959e-13 | 0.000001 | LULUS |
| B4.bridge.comp.D81 | Komponen HPP Sep D81 | BRIDGE GP!D81 | 0.2131422802341651212518495250074812966886 | 0.21314228023416512 | -1.25185e-18 | 0.000001 | LULUS |
| B4.bridge.comp.D82 | Komponen HPP Sep D82 | BRIDGE GP!D82 | 0 | 0 | 0 | 0.000001 | LULUS |
| B4.bridge.comp.D83 | Komponen HPP Sep D83 | BRIDGE GP!D83 | 0.6739722296497199746598507629539415780006 | 0.6739722296497199 | -7.46599e-17 | 0.000001 | LULUS |
| B4.bridge.comp.D84 | Komponen HPP Sep D84 | BRIDGE GP!D84 | 0 | 0 | 0 | 0.000001 | LULUS |
| B4.bridge.comp.D85 | Komponen HPP Sep D85 | BRIDGE GP!D85 | 0.4922959535272559455406758662273358766682 | 0.4922959535272559 | -4.55407e-17 | 0.000001 | LULUS |
| B4.bridge.comp.D86 | Komponen HPP Sep D86 | BRIDGE GP!D86 | 0.9967733492173438162126580169860390954049 | 0.9967733492173437 | -1.16213e-16 | 0.000001 | LULUS |
| B4.bridge.comp.D87 | Komponen HPP Sep D87 | BRIDGE GP!D87 | 613.8159197785688730550748631038775532894 | 613.815919778569 | 1.26945e-13 | 0.000001 | LULUS |
| B4.bridge.comp.D88 | Komponen HPP Sep D88 | BRIDGE GP!D88 | 673.2104997197134669449251368961224467106 | 673.2104997197134 | -6.69449e-14 | 0.000001 | LULUS |
| B4.bridge.comp.D89 | Komponen HPP Sep D89 | BRIDGE GP!D89 | 4889.357966238012873055074863103877553289 | 4889.3579662380125 | -3.73055e-13 | 0.000001 | LULUS |
| B4.bridge.comp.D90 | Komponen HPP Sep D90 | BRIDGE GP!D90 | 2.801945197644999161473938517196694298565 | 2.801945197645 | 8.38526e-16 | 0.000001 | LULUS |
| B4.bridge.comp.D91 | Komponen HPP Sep D91 | BRIDGE GP!D91 | 2.978326192177661792526061482803305701436 | 2.9783261921776614 | -3.92526e-16 | 0.000001 | LULUS |
| B4.bridge.comp.D92 | Komponen HPP Sep D92 | BRIDGE GP!D92 | 15.24939456090867716147393851719669429857 | 15.249394560908677 | -1.61474e-16 | 0.000001 | LULUS |
| B4.bridge.comp.D93 | Komponen HPP Sep D93 | BRIDGE GP!D93 | 37.88691867100631632593016025915687577173 | 37.88691867100631 | -6.32593e-15 | 0.000001 | LULUS |
| B4.bridge.comp.D94 | Komponen HPP Sep D94 | BRIDGE GP!D94 | 41.07898171157858027406983974084312422827 | 41.07898171157858 | -2.7407e-16 | 0.000001 | LULUS |
| B4.bridge.comp.D95 | Komponen HPP Sep D95 | BRIDGE GP!D95 | 211.4876208645371663259301602591568757717 | 211.48762086453718 | 1.36741e-14 | 0.000001 | LULUS |
| B4.bridge.comp.D96 | Komponen HPP Sep D96 | BRIDGE GP!D96 | 111.9348399227797593717681499630625239244 | 111.93483992277974 | -1.93718e-14 | 0.000001 | LULUS |
| B4.bridge.comp.D97 | Komponen HPP Sep D97 | BRIDGE GP!D97 | 89.05930599653027962823185003693747607565 | 89.05930599653027 | -9.62823e-15 | 0.000001 | LULUS |
| B4.bridge.comp.D98 | Komponen HPP Sep D98 | BRIDGE GP!D98 | 188.6084584412192993717681499630625239244 | 188.60845844121928 | -1.93718e-14 | 0.000001 | LULUS |
| B4.bridge.comp.D99 | Komponen HPP Sep D99 | BRIDGE GP!D99 | 5304.703440104678015914247111843293647284 | 5304.703440104678 | -1.59142e-14 | 0.000001 | LULUS |
| B4.bridge.comp.D100 | Komponen HPP Sep D100 | BRIDGE GP!D100 | 806.327113619999988639752888156706352716 | 806.3271136199999 | -8.86398e-14 | 0.000001 | LULUS |
| B4.bridge.comp.D101 | Komponen HPP Sep D101 | BRIDGE GP!D101 | 352.136340064446495446 | 352.13634006444704 | 5.44554e-13 | 0.000001 | LULUS |
| B4.bridge.comp.D102 | Komponen HPP Sep D102 | BRIDGE GP!D102 | -29.73132625890803 | -29.731326258908027 | 3e-15 | 0.000001 | LULUS |
| B4.bridge.comp.D103 | Komponen HPP Sep D103 | BRIDGE GP!D103 | -8.65081725287796 | -8.650817252877985 | -2.5e-14 | 0.000001 | LULUS |
| B4.bridge.comp.D104 | Komponen HPP Sep D104 | BRIDGE GP!D104 | -25.596895951567248 | -25.596895951567248 | 0 | 0.000001 | LULUS |
| B4.bridge.comp.D105 | Komponen HPP Sep D105 | BRIDGE GP!D105 | -108.87595917 | -108.87595917 | 0 | 0.000001 | LULUS |
| B4.bridge.comp.D106 | Komponen HPP Sep D106 | BRIDGE GP!D106 | 85.100402 | 85.100402 | 0 | 0.000001 | LULUS |
| B4.bridge.comp.D107 | Komponen HPP Sep D107 | BRIDGE GP!D107 | -0.000007214228738 | -0.0000072142292992793955 | -5.61279e-13 | 0.000001 | LULUS |
| B4.bridge.wf.start | Waterfall Margin GL Agustus 2026 | BRIDGE GP!B161 | 19.92193143611329283316527047385770587186 | 19.921931436113294 | 1.16683e-15 | 0.0001 | LULUS |
| B4.bridge.wf.start.cum | Waterfall kumulatif Margin GL Agustus 2026 | BRIDGE GP!G161 | 19.92193143611329283316527047385770587186 | 19.921931436113294 | 1.16683e-15 | 0.0001 | LULUS |
| B4.bridge.wf.price | Waterfall Harga jual rata-rata | BRIDGE GP!B162 | -0.61049765884021771298990677961863897225 | -0.6104976588402145 | 3.21299e-15 | 0.0001 | LULUS |
| B4.bridge.wf.price.cum | Waterfall kumulatif Harga jual rata-rata | BRIDGE GP!G162 | 19.31143377727307512017536369423906689961 | 19.31143377727308 | 4.87982e-15 | 0.0001 | LULUS |
| B4.bridge.wf.volume_inventory | Waterfall Volume, mix dan persediaan | BRIDGE GP!B163 | 0.145804768490323460138651442540287996894 | 0.14580476849028656 | -3.69001e-14 | 0.0001 | LULUS |
| B4.bridge.wf.volume_inventory.cum | Waterfall kumulatif Volume, mix dan persediaan | BRIDGE GP!G163 | 19.4572385457633985803140151367793548965 | 19.457238545763367 | -3.15803e-14 | 0.0001 | LULUS |
| B4.bridge.wf.fcc_material | Waterfall Material FCC | BRIDGE GP!B164 | -0.94408633631210082882306606328551914819 | -0.9440863363121008 | 2.88231e-17 | 0.0001 | LULUS |
| B4.bridge.wf.fcc_material.cum | Waterfall kumulatif Material FCC | BRIDGE GP!G164 | 18.51315220945129775149094907349383574831 | 18.513152209451267 | -3.07515e-14 | 0.0001 | LULUS |
| B4.bridge.wf.variable_conversion | Waterfall Konversi variabel | BRIDGE GP!B165 | -1.557908669530439326731405346267256635945 | -1.55790866953044 | -6.73269e-16 | 0.0001 | LULUS |
| B4.bridge.wf.variable_conversion.cum | Waterfall kumulatif Konversi variabel | BRIDGE GP!G165 | 16.95524353992085842475954372722657911237 | 16.955243539920826 | -3.24248e-14 | 0.0001 | LULUS |
| B4.bridge.wf.fixed_volume | Waterfall Tetap: efek volume | BRIDGE GP!B166 | -2.433923490174819121711587958610975570936 | -2.4339234901748203 | -1.17829e-15 | 0.0001 | LULUS |
| B4.bridge.wf.fixed_volume.cum | Waterfall kumulatif Tetap: efek volume | BRIDGE GP!G166 | 14.52132004974603930304795576861560354143 | 14.521320049746006 | -3.3303e-14 | 0.0001 | LULUS |
| B4.bridge.wf.fixed_spending | Waterfall Tetap: belanja | BRIDGE GP!B167 | -0.260268821919643828419656156605371490696 | -0.26026882191964046 | 3.36842e-15 | 0.0001 | LULUS |
| B4.bridge.wf.fixed_spending.cum | Waterfall kumulatif Tetap: belanja | BRIDGE GP!G167 | 14.26105122782639547462829961201023205073 | 14.261051227826366 | -2.94746e-14 | 0.0001 | LULUS |
| B4.bridge.wf.gl_other | Waterfall GL lain | BRIDGE GP!B168 | 2.158303956409993154725385695044650667084 | 2.1583039564099935 | 3.45275e-16 | 0.0001 | LULUS |
| B4.bridge.wf.gl_other.cum | Waterfall kumulatif GL lain | BRIDGE GP!G168 | 16.41935518423638862935368530705488271781 | 16.41935518423636 | -2.86294e-14 | 0.0001 | LULUS |
| B4.bridge.wf.timing | Waterfall Waktu pencatatan | BRIDGE GP!B169 | -1.853616832634191196400541147651270954999 | -1.8536168326341913 | -1.03599e-16 | 0.0001 | LULUS |
| B4.bridge.wf.timing.cum | Waterfall kumulatif Waktu pencatatan | BRIDGE GP!G169 | 14.56573835160219743295314415940361176281 | 14.565738351602167 | -3.0433e-14 | 0.0001 | LULUS |
| B4.bridge.wf.end | Waterfall Margin GL September 2026 | BRIDGE GP!B170 | 14.56573835160219743295314415940361176282 | 14.565738351602166 | -3.1433e-14 | 0.0001 | LULUS |
| B4.bridge.wf.end.cum | Waterfall kumulatif Margin GL September 2026 | BRIDGE GP!G170 | 14.56573835160219743295314415940361176282 | 14.565738351602166 | -3.1433e-14 | 0.0001 | LULUS |
| B4.bridge.display.b2_b12 | Volume, mix, dan persediaan (b2 + b12) | BRIDGE GP!B163 | 0.145804768490323460138651442540287996894 | 0.14580476849028656 | -3.69001e-14 | 0.0001 | LULUS |
| B4.bridge.input.REV_T | Input bridge REV_T (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D7 | 7462.36015266 | 7462.3601526600005 | 5e-13 | 0.000001 | LULUS |
| B4.bridge.input.REV_F | Input bridge REV_F (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D8 | 5901.31314207 | 5901.31314207 | 0 | 0.000001 | LULUS |
| B4.bridge.input.REV_U | Input bridge REV_U (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D9 | 321.7005 | 321.7005 | 0 | 0.000001 | LULUS |
| B4.bridge.input.REV_O | Input bridge REV_O (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D10 | 321.67245 | 321.67245 | 0 | 0.000001 | LULUS |
| B4.bridge.input.REV_L | Input bridge REV_L (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D11 | 917.67406059 | 917.6740605900001 | 1e-13 | 0.000001 | LULUS |
| B4.bridge.input.Q_F | Input bridge Q_F (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D12 | 210907.5 | 210907.5 | 0 | 0.01 | LULUS |
| B4.bridge.input.Q_U | Input bridge Q_U (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D13 | 6633 | 6633 | 0 | 0.01 | LULUS |
| B4.bridge.input.Q_O | Input bridge Q_O (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D14 | 6715.5 | 6715.5 | 0 | 0.01 | LULUS |
| B4.bridge.input.P_F | Input bridge P_F (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D15 | 236923 | 236923 | 0 | 0.01 | LULUS |
| B4.bridge.input.P_U | Input bridge P_U (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D16 | 467.5 | 467.5 | 0 | 0.01 | LULUS |
| B4.bridge.input.P_O | Input bridge P_O (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D17 | 6715.5 | 6715.5 | 0 | 0.01 | LULUS |
| B4.bridge.input.P_L | Input bridge P_L (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D18 | 45653.42 | 45653.42 | 0 | 0.01 | LULUS |
| B4.bridge.input.MAT_F | Input bridge MAT_F (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D19 | 4275.5420464594436 | 4275.542046459444 | 4e-13 | 0.000001 | LULUS |
| B4.bridge.input.MAT_U | Input bridge MAT_U (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D20 | 12.447449363263678 | 12.447449363263678 | 0 | 0.000001 | LULUS |
| B4.bridge.input.MAT_O | Input bridge MAT_O (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D21 | 173.60070219353086 | 173.60070219353085 | -1e-14 | 0.000001 | LULUS |
| B4.bridge.input.MAT_L | Input bridge MAT_L (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D22 | 76.67361851843955 | 76.67361851843954 | -1e-14 | 0.000001 | LULUS |
| B4.bridge.input.SGK | Input bridge SGK (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D23 | 2309.9755730717798 | 2309.9755730717798 | 0 | 0.000001 | LULUS |
| B4.bridge.input.ONG | Input bridge ONG (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D24 | 41.897465 | 41.897465 | 0 | 0.000001 | LULUS |
| B4.bridge.input.OLE | Input bridge OLE (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D25 | 1013.4280919558713 | 1013.4280919558713 | 0 | 0.000001 | LULUS |
| B4.bridge.input.CNG | Input bridge CNG (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D26 | 774.6622586113678 | 774.6622586113679 | 1e-13 | 0.000001 | LULUS |
| B4.bridge.input.OTH | Input bridge OTH (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D27 | 135.57865782042482 | 135.57865782042484 | 2e-14 | 0.000001 | LULUS |
| B4.bridge.input.PT_A | Input bridge PT_A (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D28 | 469.3145567522302 | 469.3145567522302 | 0 | 0.000001 | LULUS |
| B4.bridge.input.PF_A | Input bridge PF_A (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D29 | 100.03077477325684 | 100.03077477325684 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_A_F | Input bridge AL_A_F (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D30 | 384.8565492002359 | 384.8565492002359 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_A_U | Input bridge AL_A_U (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D31 | 1.976184740843103 | 1.976184740843103 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_A_O | Input bridge AL_A_O (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D32 | 24.08339425928573 | 24.08339425928573 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_A_L | Input bridge AL_A_L (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D33 | 58.39842855186545 | 58.39842855186545 | 0 | 0.000001 | LULUS |
| B4.bridge.input.PT_K | Input bridge PT_K (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D34 | 53.59862496108998 | 53.59862496108998 | 0 | 0.000001 | LULUS |
| B4.bridge.input.PF_K | Input bridge PF_K (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D35 | 0 | 0 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_K_F | Input bridge AL_K_F (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D36 | 53.59862496108998 | 53.59862496108998 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_K_U | Input bridge AL_K_U (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D37 | 0 | 0 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_K_O | Input bridge AL_K_O (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D38 | 0 | 0 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_K_L | Input bridge AL_K_L (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D39 | 0 | 0 | 0 | 0.000001 | LULUS |
| B4.bridge.input.PT_B | Input bridge PT_B (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D40 | 419.5672132866798 | 419.5672132866798 | 0 | 0.000001 | LULUS |
| B4.bridge.input.PF_B | Input bridge PF_B (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D41 | 282.77665022674316 | 282.7766502267432 | 4e-14 | 0.000001 | LULUS |
| B4.bridge.input.AL_B_F | Input bridge AL_B_F (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D42 | 344.0617546161456 | 344.0617546161456 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_B_U | Input bridge AL_B_U (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D43 | 1.766709156419662 | 1.766709156419662 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_B_O | Input bridge AL_B_O (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D44 | 21.530554444718737 | 21.53055444471874 | 3e-15 | 0.000001 | LULUS |
| B4.bridge.input.AL_B_L | Input bridge AL_B_L (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D45 | 52.2081950693958 | 52.208195069395806 | 6e-15 | 0.000001 | LULUS |
| B4.bridge.input.PT_C | Input bridge PT_C (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D46 | 46.73726 | 46.73726 | 0 | 0.000001 | LULUS |
| B4.bridge.input.PF_C | Input bridge PF_C (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D47 | 0 | 0 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_C_F | Input bridge AL_C_F (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D48 | 35.25331406903919 | 35.25331406903919 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_C_U | Input bridge AL_C_U (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D49 | 0.027926782660179055 | 0.027926782660179054 | -1e-18 | 0.000001 | LULUS |
| B4.bridge.input.AL_C_O | Input bridge AL_C_O (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D50 | 0.4963923026229416 | 0.4963923026229416 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_C_L | Input bridge AL_C_L (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D51 | 10.959626845677692 | 10.959626845677693 | 1e-15 | 0.000001 | LULUS |
| B4.bridge.input.PT_D | Input bridge PT_D (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D52 | 313.48576927 | 313.48576927 | 0 | 0.000001 | LULUS |
| B4.bridge.input.PF_D | Input bridge PF_D (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D53 | 154.3277757 | 154.3277757 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_D_F | Input bridge AL_D_F (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D54 | 214.9726080976878 | 214.9726080976878 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_D_U | Input bridge AL_D_U (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D55 | 1.261824927294265 | 1.261824927294265 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_D_O | Input bridge AL_D_O (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D56 | 22.428655272909626 | 22.428655272909626 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_D_L | Input bridge AL_D_L (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D57 | 74.82268097210826 | 74.82268097210826 | 0 | 0.000001 | LULUS |
| B4.bridge.input.PT_E | Input bridge PT_E (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D58 | 270.06331292 | 270.06331292000004 | 4e-14 | 0.000001 | LULUS |
| B4.bridge.input.PF_E | Input bridge PF_E (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D59 | 269.19191292 | 269.19191292 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_E_F | Input bridge AL_E_F (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D60 | 254.28356855408388 | 254.28356855408387 | -1e-14 | 0.000001 | LULUS |
| B4.bridge.input.AL_E_U | Input bridge AL_E_U (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D61 | 0.7476257826054519 | 0.7476257826054519 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_E_O | Input bridge AL_E_O (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D62 | 10.426904103047859 | 10.426904103047859 | 0 | 0.000001 | LULUS |
| B4.bridge.input.AL_E_L | Input bridge AL_E_L (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D63 | 4.60521448026283 | 4.60521448026283 | 0 | 0.000001 | LULUS |
| B4.bridge.input.HPP_WP | Input bridge HPP_WP (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D64 | 6463.16689378912432 | 6463.1668937891245 | 1.8e-13 | 0.000001 | LULUS |
| B4.bridge.input.HPP_GL | Input bridge HPP_GL (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D65 | 6375.41230437 | 6375.41230437 | 0 | 0.000001 | LULUS |
| B4.bridge.input.L38 | Input bridge L38 (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D66 | -121.1481902989076785 | -121.14819029890805 | -3.715e-13 | 0.000001 | LULUS |
| B4.bridge.input.L39 | Input bridge L39 (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D67 | -326.539444112878878 | -326.5394441128789 | -2.2e-14 | 0.000001 | LULUS |
| B4.bridge.input.L40 | Input bridge L40 (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D68 | 409.305490900001 | 409.30549090000096 | -4e-14 | 0.000001 | LULUS |
| B4.bridge.input.L41 | Input bridge L41 (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D69 | -25.59689595156724807181354266679 | -25.596895951567248 | 7.18135e-17 | 0.000001 | LULUS |
| B4.bridge.input.L42 | Input bridge L42 (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D70 | -23.77555717 | -23.775557170000017 | -1.7e-14 | 0.000001 | LULUS |
| B4.bridge.input.L43 | Input bridge L43 (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D71 | 0 | 0 | 0 | 0.000001 | LULUS |
| B4.bridge.input.OLD | Input bridge OLD (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D72 | 91.41686404 | 91.41686404000002 | 2e-14 | 0.000001 | LULUS |
| B4.bridge.input.B8_OPEX | Input bridge B8_OPEX (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D73 | 108.87595917 | 108.87595917 | 0 | 0.000001 | LULUS |
| B4.bridge.input.B8_THR | Input bridge B8_THR (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D74 | 34.774256 | 34.774256 | 0 | 0.000001 | LULUS |
| B4.bridge.input.B8_TALI | Input bridge B8_TALI (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D75 | -32.360982 | -32.360982 | 0 | 0.000001 | LULUS |
| B4.bridge.input.B8_ONG | Input bridge B8_ONG (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D76 | -87.513676 | -87.513676 | 0 | 0.000001 | LULUS |
| B4.bridge.input.B8_PIS | Input bridge B8_PIS (dirakit dari keluaran Fase 2/3) | BRIDGE GP!D77 | 0 | 0 | 0 | 0.000001 | LULUS |

Semua sel golden lulus.
