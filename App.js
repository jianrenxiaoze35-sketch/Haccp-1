import { useState, useEffect, useRef, useCallback } from 'react';

const GAS_URL = "https://script.google.com/macros/s/AKfycbxnULk38ooEgngGD_Ek5T8bushj6a26LCcHYQqxX-3AM2RuKnbsA2on1fsOrP69JnX3/exec";
const STORAGE_KEY = "daily-check-staff-v1";

const OPENING_PROPS = [
  "健康確認","手洗い実施","身だしなみ","冷蔵庫温度確認",
  "原材料受入確認","交差汚染防止確認","調理器具殺菌確認",
  "ガス電気点検","湯沸かし","作業場清掃消毒","ハイター済タオル干し",
  "仕込み在庫補充","食洗機作動確認","ビールサーバー確認",
  "ドリンク在庫補充","客席清掃消毒","カトラリー補充","消耗品補充",
  "メニューブック消毒","ソフトクリームサーバー確認","トイレ洗浄消毒",
  "床清掃","風除室清掃",
];

const CLOSING_PROPS = [
  "フライヤー締め","ガスコンロ洗浄","食洗機洗浄締め","ガス栓電源換気扇確認",
  "冷蔵冷凍庫確認","調理器具食器洗浄","調理器具サプライ","作業台清掃",
  "シンク清掃","タオル類回収","タオルスポンジハイター殺菌",
  "翌日タオル準備","コバエ駆除剤セット","ゴミ箱チェック",
];

const ITEMS = {
  opening: [
    {id:"健康確認",label:"健康確認",detail:"体調・検温・傷の有無。発熱・消化器症状は出勤不可",area:"HACCP",isHACCP:true},
    {id:"手洗い実施",label:"手洗い実施",detail:"石けん30秒以上＋アルコール消毒",area:"HACCP",isHACCP:true},
    {id:"身だしなみ",label:"身だしなみ",detail:"ユニフォーム・髪・爪・アクセサリー確認",area:"HACCP",isHACCP:true},
    {id:"冷蔵庫温度確認",label:"冷蔵庫温度確認",detail:"2〜7℃以内か確認",area:"HACCP",isHACCP:true},
    {id:"原材料受入確認",label:"原材料受入確認",detail:"外観・におい・期限・包装状態確認",area:"HACCP",isHACCP:true},
    {id:"交差汚染防止確認",label:"交差汚染防止確認",detail:"冷蔵庫保管状態・まな板用途別使い分け確認",area:"HACCP",isHACCP:true},
    {id:"調理器具殺菌確認",label:"調理器具殺菌確認",detail:"まな板漂白・包丁洗浄消毒確認",area:"HACCP",isHACCP:true},
    {id:"ガス電気点検",label:"ガス・電気点検",detail:"コンロ・フライヤー・オーブン動作確認",area:"キッチン",isHACCP:false},
    {id:"湯沸かし",label:"湯沸かし",detail:"お湯を沸かして保温開始",area:"キッチン",isHACCP:false},
    {id:"作業場清掃消毒",label:"作業場清掃消毒",detail:"調理台・棚・シンク周辺の清掃・消毒",area:"キッチン",isHACCP:false},
    {id:"ハイター済タオル干し",label:"ハイター済タオル干し",detail:"前日殺菌タオルを干してセット",area:"キッチン",isHACCP:false},
    {id:"仕込み在庫補充",label:"仕込み在庫補充",detail:"本日営業分の材料確認・補充",area:"キッチン",isHACCP:false},
    {id:"食洗機作動確認",label:"食洗機作動確認",detail:"動作・洗浄剤残量・試運転確認",area:"キッチン",isHACCP:false},
    {id:"ビールサーバー確認",label:"ビールサーバー確認",detail:"タップ動作・ガス圧・温度確認。最初の一杯は捨て注ぎ",area:"ホール",isHACCP:false},
    {id:"ドリンク在庫補充",label:"ドリンク在庫補充",detail:"ボトル・缶・シロップ類確認・補充",area:"ホール",isHACCP:false},
    {id:"客席清掃消毒",label:"客席清掃消毒",detail:"テーブル・椅子・床の清掃・消毒",area:"ホール",isHACCP:false},
    {id:"カトラリー補充",label:"カトラリー補充",detail:"フォーク・箸・ナプキン補充・清潔確認",area:"ホール",isHACCP:false},
    {id:"消耗品補充",label:"消耗品補充",detail:"おしぼり・ウェットティッシュ等補充",area:"ホール",isHACCP:false},
    {id:"メニューブック消毒",label:"メニューブック消毒",detail:"アルコールで全面拭き消毒",area:"ホール",isHACCP:false},
    {id:"ソフトクリームサーバー確認",label:"ソフトクリームサーバー",detail:"動作・温度・清潔状態確認",area:"ホール",isHACCP:false},
    {id:"トイレ洗浄消毒",label:"トイレ洗浄消毒",detail:"専用エプロン着用・便座・ドアノブ等消毒",area:"ホール",isHACCP:false},
    {id:"床清掃",label:"床清掃",detail:"ホール・通路 掃き・モップがけ",area:"ホール",isHACCP:false},
    {id:"風除室清掃",label:"風除室清掃",detail:"入口・ガラス・マット清掃",area:"ホール",isHACCP:false},
  ],
  closing: [
    {id:"フライヤー締め",label:"フライヤー締め",detail:"電源OFF・ガス栓・バスケット等洗浄",area:"設備",isHACCP:false},
    {id:"ガスコンロ洗浄",label:"ガスコンロ洗浄",detail:"コンロ全体・五徳・バーナーキャップ清掃",area:"設備",isHACCP:false},
    {id:"食洗機洗浄締め",label:"食洗機洗浄・締め",detail:"内部洗浄・最終運転後の締め",area:"設備",isHACCP:false},
    {id:"ガス栓電源換気扇確認",label:"ガス栓・電源・換気扇",detail:"全ガス栓閉・不要電源OFF・換気扇停止確認",area:"設備",isHACCP:false},
    {id:"冷蔵冷凍庫確認",label:"冷蔵・冷凍庫確認",detail:"扉閉確認・温度異常チェック。異常時は管理者に報告",area:"安全",isHACCP:true},
    {id:"調理器具食器洗浄",label:"調理器具・食器洗浄",detail:"使用した調理器具・食器類の洗浄・乾燥",area:"清掃",isHACCP:false},
    {id:"調理器具サプライ",label:"調理器具サプライ",detail:"翌日分の器具・食器類を所定の場所にセット",area:"清掃",isHACCP:false},
    {id:"作業台清掃",label:"作業台清掃",detail:"調理作業台の消毒・清掃",area:"清掃",isHACCP:true},
    {id:"シンク清掃",label:"シンク清掃",detail:"シンク内部・排水口の清掃",area:"清掃",isHACCP:false},
    {id:"タオル類回収",label:"タオル類回収",detail:"使用済みタオル類を回収してまとめる",area:"清掃",isHACCP:false},
    {id:"タオルスポンジハイター殺菌",label:"タオル・スポンジ殺菌",detail:"ハイターで殺菌処理・翌日まで漬け置き",area:"衛生",isHACCP:true},
    {id:"翌日タオル準備",label:"翌日タオル準備",detail:"翌日使用タオル類を所定の場所に準備",area:"衛生",isHACCP:false},
    {id:"コバエ駆除剤セット",label:"コバエ駆除剤セット",detail:"所定の場所にコバエ駆除剤をセット",area:"衛生",isHACCP:false},
    {id:"ゴミ箱チェック",label:"ゴミ箱チェック",detail:"ゴミをまとめて厨房裏通路へ。ゴミ箱汚れは清掃",area:"ゴミ",isHACCP:false},
  ],
};

const AS = {
  HACCP:   {c:"#A32D2D",bg:"#FCEBEB",bd:"#E24B4A"},
  キッチン: {c:"#633806",bg:"#FAEEDA",bd:"#EF9F27"},
  ホール:   {c:"#085041",bg:"#E1F5EE",bd:"#1D9E75"},
  設備:    {c:"#633806",bg:"#FAEEDA",bd:"#EF9F27"},
  安全:    {c:"#A32D2D",bg:"#FCEBEB",bd:"#E24B4A"},
  清掃:    {c:"#085041",bg:"#E1F5EE",bd:"#1D9E75"},
  衛生:    {c:"#3C3489",bg:"#EEEDFE",bd:"#7F77DD"},
  ゴミ:    {c:"#444441",bg:"#F1EFE8",bd:"#B4B2A9"},
};

// ─── CSS ─────────────────────────────────────────────────────
const css = `
  :root { --op: #0F6E56; --cl: #534AB7; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif; background: #f5f5f5; color: #1a1a1a; min-height: 100vh; }
  button, input { font-family: inherit; }
  .scr { display: none; min-height: 100vh; flex-direction: column; }
  .scr.on { display: flex; }
  .ph { background: #fff; border-bottom: 0.5px solid #e5e5e5; padding: 12px 16px; display: flex; align-items: center; gap: 10px; position: sticky; top: 0; z-index: 10; }
  .ph-info { flex: 1; }
  .ph-eye { font-size: 11px; color: #999; letter-spacing: .1em; }
  .ph-title { font-size: 15px; font-weight: 500; }
  .bk { width: 32px; height: 32px; border-radius: 8px; background: #f5f5f5; border: 0.5px solid #e0e0e0; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px; }
  .dbadge { background: #f5f5f5; border: 0.5px solid #e0e0e0; border-radius: 8px; padding: 4px 10px; text-align: right; flex-shrink: 0; }
  .dbadge-s { font-size: 9px; color: #999; letter-spacing: .06em; }
  .dbadge-v { font-size: 11px; font-weight: 500; color: #666; }
  .bot { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 16px 24px; background: #fff; border-top: 0.5px solid #e5e5e5; z-index: 20; }
  .mb { width: 100%; padding: 14px; border-radius: 12px; border: none; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; transition: all .25s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .mb:disabled { background: #e0e0e0 !important; color: #999 !important; cursor: not-allowed; }
  .h-hero { padding: 24px 16px 0; }
  .h-eye { font-size: 11px; color: #999; letter-spacing: .12em; margin-bottom: 5px; }
  .h-h1 { font-size: 22px; font-weight: 500; margin-bottom: 4px; }
  .h-date { font-size: 13px; color: #666; margin-bottom: 20px; }
  .h-cards { padding: 0 16px; display: flex; flex-direction: column; gap: 10px; }
  .mc { background: #fff; border: 0.5px solid #e5e5e5; border-radius: 12px; padding: 16px; cursor: pointer; text-align: left; transition: background .15s; }
  .mc:hover { background: #f9f9f9; }
  .mc-tm { font-size: 11px; font-weight: 500; letter-spacing: .1em; margin-bottom: 5px; }
  .mc-nm { font-size: 16px; font-weight: 500; margin-bottom: 3px; }
  .mc-sb { font-size: 12px; color: #666; margin-bottom: 10px; }
  .mc-tags { display: flex; gap: 5px; flex-wrap: wrap; }
  .tag { font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 6px; border: 0.5px solid; }
  .h-bottom { padding: 12px 16px 32px; display: flex; flex-direction: column; gap: 10px; }
  .rp { background: #fff; border: 0.5px solid #e5e5e5; border-radius: 12px; padding: 14px 16px; }
  .rp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .rp-title { font-size: 11px; font-weight: 500; color: #666; letter-spacing: .1em; }
  .rp-btn { font-size: 12px; color: #0066cc; background: none; border: none; cursor: pointer; padding: 0; }
  .rp-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 0.5px solid #f0f0f0; }
  .rp-row:last-child { border-bottom: none; }
  .rp-empty { font-size: 12px; color: #aaa; text-align: center; padding: 10px 0; }
  .mgr-inner { flex: 1; overflow-y: auto; padding: 16px 16px 40px; }
  .staff-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #fff; border: 0.5px solid #e5e5e5; border-radius: 8px; margin-bottom: 6px; }
  .staff-item-name { flex: 1; font-size: 14px; font-weight: 500; }
  .del-btn { width: 32px; height: 32px; border-radius: 8px; border: 0.5px solid #e0e0e0; background: #f5f5f5; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .15s; }
  .del-btn:hover { background: #FCEBEB; border-color: #E24B4A; color: #A32D2D; }
  .add-row { display: flex; gap: 8px; margin-bottom: 8px; }
  .add-row input { flex: 1; padding: 10px 12px; border-radius: 8px; border: 0.5px solid #e0e0e0; background: #fff; color: #1a1a1a; font-size: 14px; outline: none; }
  .add-row input:focus { outline: 2px solid #0066cc; outline-offset: 1px; }
  .add-row button { padding: 10px 14px; border-radius: 8px; border: none; background: #E6F1FB; color: #185FA5; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
  .err { font-size: 12px; color: #A32D2D; margin-bottom: 8px; display: none; }
  .err.on { display: block; }
  .sec-label { font-size: 11px; color: #999; font-weight: 500; letter-spacing: .1em; margin-bottom: 8px; }
  .hint-box { background: #f5f5f5; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #666; line-height: 1.5; }
  .st-inner { flex: 1; overflow-y: auto; padding: 16px 16px 100px; }
  .st-top { text-align: center; margin-bottom: 20px; }
  .st-em { font-size: 36px; margin-bottom: 10px; }
  .st-h { font-size: 18px; font-weight: 500; margin-bottom: 4px; }
  .st-sub { font-size: 13px; color: #666; line-height: 1.6; }
  .staff-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 20px; }
  .sg-btn { padding: 12px 10px; border-radius: 12px; border: 0.5px solid #e0e0e0; background: #fff; color: #1a1a1a; font-size: 14px; font-weight: 500; cursor: pointer; transition: all .15s; text-align: left; display: flex; align-items: center; gap: 8px; }
  .sg-btn:hover { background: #f5f5f5; }
  .sg-btn.sel { color: #fff; border-color: transparent; }
  .direct-row { display: flex; gap: 8px; margin-bottom: 8px; }
  .direct-row input { flex: 1; padding: 10px 12px; border-radius: 8px; border: 0.5px solid #e0e0e0; background: #fff; color: #1a1a1a; font-size: 14px; outline: none; }
  .direct-row input:focus { outline: 2px solid #0066cc; outline-offset: 1px; }
  .ck-sticky { position: sticky; top: 0; z-index: 10; background: #fff; border-bottom: 0.5px solid #e5e5e5; padding: 12px 16px 10px; }
  .ck-hdr { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .ck-inf { flex: 1; }
  .ck-mode { font-size: 11px; font-weight: 500; letter-spacing: .1em; margin-bottom: 2px; }
  .ck-tt { font-size: 15px; font-weight: 500; }
  .sbadge { display: flex; align-items: center; gap: 5px; background: #f5f5f5; border: 0.5px solid #e0e0e0; border-radius: 12px; padding: 5px 10px; cursor: pointer; flex-shrink: 0; }
  .sbadge-nm { font-size: 12px; font-weight: 500; }
  .sbadge-ed { font-size: 10px; color: #999; }
  .ftabs { display: flex; gap: 5px; overflow-x: auto; margin-bottom: 8px; padding-bottom: 2px; }
  .ftabs::-webkit-scrollbar { display: none; }
  .ft { padding: 5px 11px; border-radius: 20px; border: 0.5px solid #e0e0e0; cursor: pointer; font-size: 12px; font-weight: 500; white-space: nowrap; background: #fff; color: #666; transition: all .15s; }
  .ft.on { border-color: transparent; color: #fff; }
  .prog-row { display: flex; align-items: center; gap: 8px; }
  .prog-lbl { font-size: 11px; font-weight: 500; min-width: 90px; }
  .btrack { flex: 1; height: 4px; background: #e5e5e5; border-radius: 4px; overflow: hidden; }
  .bfill { height: 100%; border-radius: 4px; transition: width .35s ease; }
  .prog-ct { font-size: 11px; color: #999; min-width: 36px; text-align: right; }
  .adiv { display: flex; align-items: center; gap: 8px; padding: 10px 16px 6px; }
  .adiv-line { flex: 1; height: 0.5px; background: #e5e5e5; }
  .adiv-lbl { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 20px; border: 0.5px solid; }
  .ci { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; background: #fff; border: none; border-bottom: 0.5px solid #f0f0f0; cursor: pointer; text-align: left; width: 100%; transition: background .15s; }
  .ci:hover { background: #fafafa; }
  .ci-box { width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0; margin-top: 1px; background: transparent; border: 1.5px solid #ccc; display: flex; align-items: center; justify-content: center; transition: all .15s; }
  .ci-box.on { border: none; }
  .ci-tx { flex: 1; min-width: 0; }
  .ci-lr { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 3px; }
  .ci-lb { font-size: 14px; font-weight: 500; transition: all .15s; }
  .ci.ck .ci-lb { color: #bbb; text-decoration: line-through; }
  .hbg { font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 6px; border: 0.5px solid #E24B4A; color: #A32D2D; background: #FCEBEB; }
  .abg { font-size: 10px; padding: 2px 6px; border-radius: 6px; border: 0.5px solid #e0e0e0; color: #999; }
  .ci-dt { font-size: 12px; color: #888; line-height: 1.5; }
  .cf-body { flex: 1; overflow-y: auto; padding: 16px 16px 100px; }
  .scard { background: #fff; border: 0.5px solid #e5e5e5; border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
  .srow { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 0.5px solid #f0f0f0; }
  .srow:last-child { border-bottom: none; }
  .srow-ic { color: #999; font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
  .srow-lb { font-size: 12px; color: #666; min-width: 60px; }
  .srow-vl { font-size: 13px; font-weight: 500; flex: 1; }
  .ablock { background: #fff; border: 0.5px solid #e5e5e5; border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
  .ablock-h { padding: 9px 14px; border-bottom: 0.5px solid #f0f0f0; display: flex; justify-content: space-between; }
  .ablock-p { padding: 8px 12px 10px; display: flex; flex-wrap: wrap; gap: 5px; }
  .pill { font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 500; }
  .pill-ng { border: 0.5px solid #e0e0e0; color: #bbb; }
  .hblock { border: 0.5px solid; border-radius: 12px; padding: 11px 14px; margin-bottom: 10px; }
  .done-in { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 20px; text-align: center; }
  .done-sg { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; max-width: 300px; margin-bottom: 24px; }
  .done-st { background: #f5f5f5; border-radius: 8px; padding: 12px; }
  .done-sl { font-size: 11px; color: #666; margin-bottom: 4px; }
  .done-sv { font-size: 15px; font-weight: 500; }
  .toast { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); background: #1a1a1a; color: #fff; font-size: 13px; padding: 10px 18px; border-radius: 12px; z-index: 100; opacity: 0; transition: opacity .3s; pointer-events: none; white-space: nowrap; }
  .toast.show { opacity: 1; }
  .rec-card { background: #fff; border: 0.5px solid #e5e5e5; border-radius: 12px; overflow: hidden; margin-bottom: 10px; }
`;

function getToday() {
  const d = new Date();
  return {
    iso: d.toISOString().split("T")[0],
    jp: d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" }),
    time: d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState(null);
  const [today, setToday] = useState(getToday);
  const [items, setItems] = useState([]);
  const [checks, setChecks] = useState({});
  const [staff, setStaff] = useState("");
  const [filter, setFilter] = useState("all");
  const [sending, setSending] = useState(false);
  const [records, setRecords] = useState([]);
  const [staffNames, setStaffNames] = useState([]);
  const [mgrInp, setMgrInp] = useState("");
  const [mgrErr, setMgrErr] = useState("");
  const [stInp, setStInp] = useState("");
  const [stErr, setStErr] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [recFilter, setRecFilter] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setStaffNames(JSON.parse(saved)); } catch (_) {}
    }
  }, []);

  const saveStaff = (names) => {
    setStaffNames(names);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  };

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2000);
  };

  const aHex = () => mode === "opening" ? "#0F6E56" : "#534AB7";
  const mLabel = () => mode === "opening" ? "開店前チェック" : "締め作業チェック";
  const tLabel = () => mode === "opening" ? "MORNING" : "NIGHT";

  const startMode = (m) => {
    setMode(m);
    setItems(ITEMS[m]);
    setChecks({});
    setStaff("");
    setStInp("");
    setFilter("all");
    setSending(false);
    setToday(getToday());
    setScreen("staff");
  };

  const addStaff = () => {
    const name = mgrInp.trim();
    if (!name) { setMgrErr("名前を入力してください"); return; }
    if (staffNames.includes(name)) { setMgrErr(`「${name}」はすでに登録されています`); return; }
    setMgrErr("");
    saveStaff([...staffNames, name]);
    setMgrInp("");
    showToast(`「${name}」を登録しました`);
  };

  const removeStaff = (i) => {
    const name = staffNames[i];
    saveStaff(staffNames.filter((_, idx) => idx !== i));
    showToast(`「${name}」を削除しました`);
  };

  const selectStaff = (n) => {
    setStaff(n);
    setStInp("");
    setStErr(false);
  };

  const onDirect = (v) => {
    setStaff(v.trim());
    setStErr(false);
  };

  const toCheck = () => {
    if (!staff) { setStErr(true); return; }
    setScreen("check");
  };

  const toggle = (id) => {
    setChecks(p => ({ ...p, [id]: !p[id] }));
  };

  const checkedCount = items.filter(i => checks[i.id]).length;
  const total = items.length;
  const pct = total ? Math.round(checkedCount / total * 100) : 0;
  const haccpItems = items.filter(i => i.isHACCP);
  const haccpDone = haccpItems.filter(i => checks[i.id]).length;
  const haccpOk = haccpDone === haccpItems.length;

  const visItems = filter === "all" ? items
    : filter === "pending" ? items.filter(i => !checks[i.id])
    : items.filter(i => i.area === filter);

  const areas = [...new Set(items.map(i => i.area))];

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    const props = mode === "opening" ? OPENING_PROPS : CLOSING_PROPS;
    const checksObj = {};
    props.forEach(k => { checksObj[k] = !!checks[k]; });
    const payload = {
      mode, date: today.iso, staff,
      status: haccpOk ? "✅ 完了" : "⚠️ 要確認",
      memo: "", checks: checksObj,
    };
    let ok = false;
    try {
      const res = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      ok = data.ok === true;
    } catch (err) {
      console.error("送信エラー:", err);
    }
    setRecords(p => [...p, {
      mode, staff, cd: checkedCount, ct: total, time: today.time,
      checkedItems: items.filter(i => checks[i.id]).map(i => i.id), ok,
    }]);
    setSending(false);
    setScreen("done");
  };

  const filteredRec = recFilter === "all" ? records : records.filter(r => r.mode === recFilter);

  return (
    <>
      <style>{css}</style>
      <div className={`toast${toast.show ? " show" : ""}`}>{toast.msg}</div>

      {/* HOME */}
      <div className={`scr${screen === "home" ? " on" : ""}`}>
        <div className="h-hero">
          <p className="h-eye">DAILY CHECK</p>
          <h1 className="h-h1">Daily Check</h1>
          <p className="h-date">{today.jp}</p>
        </div>
        <div className="h-cards">
          <button className="mc" onClick={() => startMode("opening")}>
            <div className="mc-tm" style={{ color: "var(--op)" }}>MORNING</div>
            <div className="mc-nm">開店前チェック</div>
            <div className="mc-sb">23項目 · HACCP 7項目含む</div>
            <div className="mc-tags">
              <span className="tag" style={{ color:"#A32D2D",borderColor:"#E24B4A",background:"#FCEBEB" }}>HACCP</span>
              <span className="tag" style={{ color:"#633806",borderColor:"#EF9F27",background:"#FAEEDA" }}>キッチン</span>
              <span className="tag" style={{ color:"#085041",borderColor:"#1D9E75",background:"#E1F5EE" }}>ホール</span>
            </div>
          </button>
          <button className="mc" onClick={() => startMode("closing")}>
            <div className="mc-tm" style={{ color: "var(--cl)" }}>NIGHT</div>
            <div className="mc-nm">締め作業チェック</div>
            <div className="mc-sb">14項目 · HACCP 3項目含む</div>
            <div className="mc-tags">
              <span className="tag" style={{ color:"#633806",borderColor:"#EF9F27",background:"#FAEEDA" }}>設備</span>
              <span className="tag" style={{ color:"#085041",borderColor:"#1D9E75",background:"#E1F5EE" }}>清掃</span>
              <span className="tag" style={{ color:"#3C3489",borderColor:"#7F77DD",background:"#EEEDFE" }}>衛生</span>
            </div>
          </button>
        </div>
        <div className="h-bottom">
          <div className="rp">
            <div className="rp-head">
              <span className="rp-title">TODAY'S RECORDS</span>
              <button className="rp-btn" onClick={() => setScreen("records")}>すべて表示 →</button>
            </div>
            {records.length === 0
              ? <div className="rp-empty">記録はまだありません</div>
              : records.slice(0, 4).map((r, i) => (
                  <div key={i} className="rp-row">
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <span style={{ fontSize:11,color:r.mode==="opening"?"var(--op)":"var(--cl)",fontWeight:500 }}>{r.mode==="opening"?"MORNING":"NIGHT"}</span>
                      <span style={{ fontSize:13,fontWeight:500 }}>{r.staff}</span>
                    </div>
                    <span style={{ fontSize:12,fontWeight:500,color:Math.round(r.cd/r.ct*100)===100?(r.mode==="opening"?"var(--op)":"var(--cl)"):"#666" }}>{r.cd}/{r.ct}</span>
                  </div>
                ))
            }
          </div>
          <button onClick={() => setScreen("manager")} style={{ padding:"12px 16px",borderRadius:12,background:"#fff",border:"0.5px solid #e5e5e5",color:"#666",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:8,justifyContent:"center" }}>
            <i className="ti ti-users" aria-hidden="true"></i> スタッフ名を管理
          </button>
        </div>
      </div>

      {/* MANAGER */}
      <div className={`scr${screen === "manager" ? " on" : ""}`}>
        <div className="ph">
          <button className="bk" onClick={() => setScreen("home")}>←</button>
          <div className="ph-info">
            <div className="ph-eye">SETTINGS</div>
            <div className="ph-title">スタッフ名の管理</div>
          </div>
        </div>
        <div className="mgr-inner">
          <p style={{ fontSize:12,color:"#666",marginBottom:16,lineHeight:1.6 }}>登録した名前はチェック記入時のクイック選択に表示されます。</p>
          <div className="sec-label">登録済みスタッフ</div>
          <div style={{ marginBottom:20 }}>
            {staffNames.length === 0
              ? <p style={{ fontSize:13,color:"#aaa",padding:"8px 0" }}>登録済みのスタッフはいません</p>
              : staffNames.map((n, i) => (
                  <div key={i} className="staff-item">
                    <i className="ti ti-user" aria-hidden="true" style={{ fontSize:16,color:"#999" }}></i>
                    <span className="staff-item-name">{n}</span>
                    <button className="del-btn" onClick={() => removeStaff(i)} aria-label={`${n}を削除`}>
                      <i className="ti ti-trash" aria-hidden="true" style={{ fontSize:15 }}></i>
                    </button>
                  </div>
                ))
            }
          </div>
          <div className="sec-label">新しいスタッフを追加</div>
          <div className="add-row">
            <input type="text" value={mgrInp} onChange={e => { setMgrInp(e.target.value); setMgrErr(""); }} placeholder="名前を入力（最大10文字）" maxLength={10} onKeyDown={e => e.key === "Enter" && addStaff()} />
            <button onClick={addStaff}><i className="ti ti-plus" aria-hidden="true"></i> 追加</button>
          </div>
          {mgrErr && <div className="err on">{mgrErr}</div>}
          <div className="hint-box">右のゴミ箱ボタンで削除できます。</div>
        </div>
      </div>

      {/* STAFF SELECT */}
      <div className={`scr${screen === "staff" ? " on" : ""}`}>
        <div className="ph">
          <button className="bk" onClick={() => setScreen("home")}>←</button>
          <div className="ph-info">
            <div className="ph-eye" style={{ color: aHex() }}>{tLabel()}</div>
            <div className="ph-title">{mLabel()}</div>
          </div>
          <div className="dbadge">
            <div className="dbadge-s">TODAY</div>
            <div className="dbadge-v">{today.iso}</div>
          </div>
        </div>
        <div className="st-inner">
          <div className="st-top">
            <div className="st-em">{mode === "opening" ? "🌅" : "🌙"}</div>
            <h2 className="st-h">記入者を選んでください</h2>
            <p className="st-sub">{today.jp}</p>
          </div>
          <div className="sec-label">登録済みスタッフ</div>
          <div className="staff-grid">
            {staffNames.length === 0
              ? <div style={{ gridColumn:"span 2",fontSize:12,color:"#aaa" }}>
                  登録済みスタッフがいません。
                  <button onClick={() => setScreen("manager")} style={{ color:"#0066cc",background:"none",border:"none",cursor:"pointer",fontSize:12 }}>追加する</button>
                </div>
              : staffNames.map(n => (
                  <button key={n} className={`sg-btn${staff === n ? " sel" : ""}`}
                    style={staff === n ? { background:aHex(),borderColor:aHex(),color:"#fff" } : {}}
                    onClick={() => selectStaff(n)}>
                    <i className="ti ti-user" aria-hidden="true" style={{ fontSize:15,flexShrink:0 }}></i>
                    <span style={{ flex:1,textAlign:"left" }}>{n}</span>
                    {staff === n && <i className="ti ti-check" aria-hidden="true" style={{ fontSize:14,flexShrink:0 }}></i>}
                  </button>
                ))
            }
          </div>
          <div className="sec-label">直接入力</div>
          <div className="direct-row">
            <input type="text" value={stInp} onChange={e => { setStInp(e.target.value); onDirect(e.target.value); }} placeholder="名前を入力" autoComplete="off" onKeyDown={e => e.key === "Enter" && toCheck()} />
          </div>
          {stErr && <div className="err on">記入者を選択または入力してください</div>}
          <button onClick={() => setScreen("manager")} style={{ marginTop:8,fontSize:12,color:"#0066cc",background:"none",border:"none",cursor:"pointer",padding:"4px 0",display:"flex",alignItems:"center",gap:4 }}>
            <i className="ti ti-settings" aria-hidden="true"></i> スタッフ名を追加・編集する
          </button>
        </div>
        <div className="bot">
          <button className="mb" onClick={toCheck} disabled={!staff} style={{ background: staff ? aHex() : "" }}>
            {staff ? `チェック開始 — ${staff} →` : "記入者を選択してください"}
          </button>
        </div>
      </div>

      {/* CHECK */}
      <div className={`scr${screen === "check" ? " on" : ""}`}>
        <div className="ck-sticky">
          <div className="ck-hdr">
            <button className="bk" onClick={() => setScreen("staff")}>←</button>
            <div className="ck-inf">
              <div className="ck-mode" style={{ color: aHex() }}>{tLabel()}</div>
              <div className="ck-tt">{mLabel()}</div>
            </div>
            <button className="sbadge" onClick={() => setScreen("staff")}>
              <i className="ti ti-user" aria-hidden="true" style={{ fontSize:14,color:"#999" }}></i>
              <span className="sbadge-nm">{staff}</span>
              <span className="sbadge-ed">変更</span>
            </button>
          </div>
          <div className="ftabs">
            {[{k:"all",l:"全項目",n:total},{...areas.map(a=>({k:a,l:a,n:items.filter(i=>i.area===a).length}))},{k:"pending",l:"未完了",n:items.filter(i=>!checks[i.id]).length}]
              .flat().map(f => (
                <button key={f.k} className={`ft${filter === f.k ? " on" : ""}`}
                  style={filter === f.k ? { background:aHex(),color:"#fff",borderColor:aHex() } : {}}
                  onClick={() => setFilter(f.k)}>{f.l}({f.n})</button>
              ))
            }
          </div>
          <div className="prog-row" style={{ marginBottom:4 }}>
            <span className="prog-lbl" style={{ color:haccpOk?"#0F6E56":"#A32D2D" }}>HACCP {haccpDone}/{haccpItems.length}</span>
            <div className="btrack"><div className="bfill" style={{ width:`${haccpItems.length?Math.round(haccpDone/haccpItems.length*100):0}%`,background:haccpOk?"#0F6E56":"#E24B4A" }}></div></div>
            <span className="prog-ct">{checkedCount}/{total}</span>
          </div>
          <div className="btrack"><div className="bfill" style={{ width:`${pct}%`,background:aHex() }}></div></div>
        </div>
        <div style={{ flex:1,overflowY:"auto",paddingBottom:80 }}>
          {visItems.length === 0
            ? <div style={{ textAlign:"center",padding:"48px 0",color:"#aaa",fontSize:13 }}>該当項目なし</div>
            : (() => {
                let lastArea = null;
                return visItems.map(item => {
                  const as = AS[item.area] || AS["ゴミ"];
                  const ck = !!checks[item.id];
                  const showDiv = item.area !== lastArea;
                  lastArea = item.area;
                  return (
                    <div key={item.id}>
                      {showDiv && (
                        <div className="adiv">
                          <div className="adiv-line"></div>
                          <span className="adiv-lbl" style={{ color:as.c,background:as.bg,borderColor:as.bd }}>{item.area}</span>
                          <div className="adiv-line"></div>
                        </div>
                      )}
                      <button className={`ci${ck ? " ck" : ""}`} onClick={() => toggle(item.id)}>
                        <div className={`ci-box${ck ? " on" : ""}`} style={ck ? { background:as.c } : {}}>
                          {ck && <i className="ti ti-check" aria-hidden="true" style={{ fontSize:13,color:"#fff" }}></i>}
                        </div>
                        <div className="ci-tx">
                          <div className="ci-lr">
                            <span className="ci-lb">{item.label}</span>
                            {item.isHACCP && <span className="hbg">HACCP</span>}
                            <span className="abg">{item.area}</span>
                          </div>
                          <div className="ci-dt">{item.detail}</div>
                        </div>
                      </button>
                    </div>
                  );
                });
              })()
          }
        </div>
        <div className="bot">
          <button className="mb" onClick={() => setScreen("confirm")}
            style={{ background: pct===100 ? aHex() : "#BA7517" }}>
            確認へ（{checkedCount}/{total}件） →
          </button>
        </div>
      </div>

      {/* CONFIRM */}
      <div className={`scr${screen === "confirm" ? " on" : ""}`}>
        <div className="ph">
          <button className="bk" onClick={() => setScreen("check")}>←</button>
          <div className="ph-info">
            <div className="ph-eye" style={{ color: aHex() }}>{tLabel()}</div>
            <div className="ph-title">{mLabel()}</div>
          </div>
        </div>
        <div className="cf-body">
          <div style={{ fontSize:16,fontWeight:500,marginBottom:4 }}>確認して送信</div>
          <div style={{ fontSize:12,color:"#666",marginBottom:16,lineHeight:1.6 }}>チェック済み項目がNotionに記録されます。</div>
          <div className="scard">
            {[
              { ic:"ti-user",lb:"記入者",vl:staff },
              { ic:"ti-calendar",lb:"日付",vl:today.jp },
              { ic:mode==="opening"?"ti-sunrise":"ti-moon",lb:"種別",vl:mLabel() },
              { ic:"ti-chart-bar",lb:"完了",vl:`${checkedCount}/${total}（${pct}%）`,danger:pct<100 },
            ].map(r => (
              <div key={r.lb} className="srow">
                <i className={`ti ${r.ic} srow-ic`} aria-hidden="true"></i>
                <span className="srow-lb">{r.lb}</span>
                <span className="srow-vl" style={r.danger ? { color:"#A32D2D" } : {}}>{r.vl}</span>
              </div>
            ))}
          </div>
          {areas.map(area => {
            const as = AS[area] || AS["ゴミ"];
            const ai = items.filter(i => i.area === area);
            const ckd = ai.filter(i => checks[i.id]);
            const unc = ai.filter(i => !checks[i.id]);
            const aok = ckd.length === ai.length;
            return (
              <div key={area} className="ablock" style={{ borderColor:aok?`${as.bd}88`:"#e5e5e5" }}>
                <div className="ablock-h">
                  <span style={{ fontSize:13,fontWeight:500,color:as.c }}>{area}</span>
                  <span style={{ fontSize:13,fontWeight:500,color:aok?as.c:"#A32D2D" }}>{ckd.length}/{ai.length}</span>
                </div>
                <div className="ablock-p">
                  {ckd.map(i => <span key={i.id} className="pill" style={{ background:as.bg,color:as.c,border:`0.5px solid ${as.bd}` }}>✓ {i.label}</span>)}
                  {unc.map(i => <span key={i.id} className="pill pill-ng">{i.label}</span>)}
                </div>
              </div>
            );
          })}
          <div className="hblock" style={{ background:haccpOk?"#E1F5EE":"#FCEBEB",borderColor:haccpOk?"#9FE1CB":"#F7C1C1" }}>
            <div style={{ fontSize:12,fontWeight:500,color:haccpOk?"#0F6E56":"#A32D2D",marginBottom:haccpOk?0:6 }}>
              {haccpOk ? "✅ HACCP 全項目完了" : "⚠️ HACCP 未完了あり"}
            </div>
            {!haccpOk && haccpItems.filter(i => !checks[i.id]).map(i => (
              <div key={i.id} style={{ fontSize:12,color:"#993C1D",marginTop:3,paddingLeft:4 }}>・{i.label}</div>
            ))}
          </div>
          <div style={{ fontSize:11,color:"#aaa",textAlign:"center",marginTop:8 }}>確認者（小沢健人）はNotionの承認ビューで対応します</div>
        </div>
        <div className="bot">
          <button className="mb" onClick={handleSend} disabled={sending}
            style={{ background:sending?"#e0e0e0":pct===100?aHex():"#BA7517" }}>
            {sending ? "Notionに送信中..." : pct===100 ? "✓ 全完了 — Notionに記録する" : `${checkedCount}/${total}件完了 — 記録する`}
          </button>
        </div>
      </div>

      {/* RECORDS */}
      <div className={`scr${screen === "records" ? " on" : ""}`}>
        <div className="ph">
          <button className="bk" onClick={() => setScreen("home")}>←</button>
          <div className="ph-info">
            <div className="ph-eye">TODAY'S RECORDS</div>
            <div className="ph-title">{today.jp}</div>
          </div>
        </div>
        <div style={{ padding:"10px 16px 6px",display:"flex",gap:6 }}>
          {[{k:"all",l:"すべて"},{k:"opening",l:"🌅 開店前"},{k:"closing",l:"🌙 締め作業"}].map(f => (
            <button key={f.k} className={`ft${recFilter===f.k?" on":""}`}
              style={recFilter===f.k?{background:"#1a1a1a",color:"#fff",borderColor:"transparent"}:{}}
              onClick={() => setRecFilter(f.k)}>{f.l}</button>
          ))}
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"10px 16px 40px" }}>
          {filteredRec.length === 0
            ? <div style={{ textAlign:"center",padding:"48px 0",color:"#aaa",fontSize:13 }}>記録がありません</div>
            : filteredRec.map((r, i) => {
                const ch = r.mode==="opening"?"#0F6E56":"#534AB7";
                const p = Math.round(r.cd/r.ct*100);
                const mi = ITEMS[r.mode]||[];
                const hd = (r.checkedItems||[]).filter(id=>{const it=mi.find(i=>i.id===id);return it&&it.isHACCP;}).length;
                const ht = mi.filter(i=>i.isHACCP).length;
                return (
                  <div key={i} className="rec-card">
                    <div style={{ padding:"12px 14px",borderBottom:"0.5px solid #f0f0f0",display:"flex",justifyContent:"space-between" }}>
                      <div>
                        <div style={{ fontSize:11,fontWeight:500,color:ch,letterSpacing:".08em" }}>{r.mode==="opening"?"MORNING":"NIGHT"}</div>
                        <div style={{ fontSize:15,fontWeight:500 }}>{r.staff}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:11,color:"#aaa" }}>{r.time}</div>
                        <div style={{ fontSize:13,fontWeight:500,color:p===100?ch:"#A32D2D" }}>{r.cd}/{r.ct}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:12,padding:"8px 14px",borderBottom:"0.5px solid #f0f0f0" }}>
                      <span style={{ fontSize:12,color:"#666" }}>完了率 <strong style={{ color:p===100?ch:"#A32D2D" }}>{p}%</strong></span>
                      <span style={{ fontSize:12,color:"#666" }}>HACCP <strong style={{ color:hd===ht?ch:"#A32D2D" }}>{hd}/{ht}</strong></span>
                      <span style={{ fontSize:12,color:"#666" }}>Notion <strong style={{ color:r.ok?ch:"#A32D2D" }}>{r.ok?"✓":"要確認"}</strong></span>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* DONE */}
      <div className={`scr${screen === "done" ? " on" : ""}`}>
        <div className="done-in">
          <div style={{ fontSize:48,marginBottom:14 }}>{pct===100?"✅":"⚠️"}</div>
          <p style={{ fontSize:11,color:"#999",letterSpacing:".1em",marginBottom:6 }}>Notion に記録しました</p>
          <h2 style={{ fontSize:18,fontWeight:500,marginBottom:4 }}>{mLabel()}</h2>
          <p style={{ fontSize:13,color:"#666",marginBottom:22 }}>{today.jp} · {staff}</p>
          <div className="done-sg">
            {[
              { l:"完了率",v:`${pct}%`,danger:pct<100 },
              { l:"HACCP",v:haccpOk?"全完了":"未完了あり",danger:!haccpOk },
              { l:"完了項目",v:`${checkedCount}件`,danger:false },
              { l:"Notion",v:records[records.length-1]?.ok?"✓ 記録済み":"要確認",danger:!records[records.length-1]?.ok },
            ].map(s => (
              <div key={s.l} className="done-st">
                <div className="done-sl">{s.l}</div>
                <div className="done-sv" style={{ color:s.danger?"#A32D2D":aHex() }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:8,width:"100%",maxWidth:280 }}>
            <button onClick={() => startMode(mode)} style={{ padding:13,borderRadius:12,background:"#f5f5f5",border:"0.5px solid #e5e5e5",color:"#666",fontSize:13,cursor:"pointer" }}>もう一度入力する</button>
            <button onClick={() => setScreen("home")} style={{ padding:13,borderRadius:12,border:"none",color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",background:aHex() }}>ホームに戻る</button>
          </div>
        </div>
      </div>
    </>
  );
}
