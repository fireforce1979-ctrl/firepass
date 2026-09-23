// ========================================================
// 소방 현장 안전관리 시스템 (FirePass) 클라이언트 설정 파일
// ========================================================

// 1. 발급받으신 실제 Supabase 접속 정보 적용 완료
const DEFAULT_SUPABASE_URL = "https://pnrlxmikvglfbipkootb.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_wu1okv3-NmPDXcoeGRjalQ_9-fiswGc";

// 2. 만약 LocalStorage에 이전의 잘못된/빈 값이 들어있다면 정리
let savedUrl = localStorage.getItem('FP_SUPABASE_URL');
let savedKey = localStorage.getItem('FP_SUPABASE_ANON_KEY');
if (savedUrl && (savedUrl.includes('YOUR_') || !savedUrl.startsWith('http'))) {
  localStorage.removeItem('FP_SUPABASE_URL');
  savedUrl = null;
}
if (savedKey && (savedKey.includes('YOUR_') || savedKey.length < 10)) {
  localStorage.removeItem('FP_SUPABASE_ANON_KEY');
  savedKey = null;
}

const SUPABASE_URL = savedUrl || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = savedKey || DEFAULT_SUPABASE_ANON_KEY;

// 3. 시스템 기본 상수
const DEFAULT_SCENE_ID = "11111111-1111-1111-1111-111111111111"; // 기본 테스트 현장 ID
const DEFAULT_TIMEOUT_MINUTES = 35; // 기본 체류 제한시간 (공기호흡기 기준 35분)

// 4. Supabase 클라이언트 초기화 헬퍼 함수
function getSupabaseClient() {
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.error("Supabase SDK가 로드되지 않았습니다.");
    return null;
  }
  if (!SUPABASE_URL || SUPABASE_URL.includes("YOUR_SUPABASE_PROJECT")) {
    return null;
  }
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 5. 브라우저 설정 모달 생성 유틸리티 (API 키 미설정 시 편리하게 입력 가능)
function checkConfigModal() {
  const isConfigured = SUPABASE_URL && !SUPABASE_URL.includes("YOUR_SUPABASE_PROJECT");
  if (!isConfigured) {
    showConfigPrompt();
  }
}

function showConfigPrompt() {
  const modalHtml = `
    <div id="configModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;">
      <div style="background:#1f2937;color:#fff;padding:24px;border-radius:16px;max-width:500px;width:100%;border:1px solid #374151;font-family:sans-serif;">
        <h2 style="font-size:1.25rem;font-weight:bold;margin-bottom:8px;color:#ef4444;">⚙️ Supabase 연동 설정</h2>
        <p style="font-size:0.875rem;color:#9ca3af;margin-bottom:16px;">
          Supabase 대시보드 (Settings ➔ API)의 <b>Project URL</b>과 <b>anon public key</b>를 입력해주세요. 입력값은 브라우저에 안전하게 저장됩니다.
        </p>
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:0.75rem;margin-bottom:4px;color:#d1d5db;">Project URL</label>
          <input id="inputSupabaseUrl" type="text" placeholder="https://xxxx.supabase.co" value="${SUPABASE_URL.includes('YOUR_') ? '' : SUPABASE_URL}" 
                 style="width:100%;padding:10px;border-radius:8px;background:#111827;border:1px solid #4b5563;color:#fff;box-sizing:border-box;" />
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:0.75rem;margin-bottom:4px;color:#d1d5db;">Anon Public Key</label>
          <textarea id="inputSupabaseKey" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsIn..." 
                    style="width:100%;padding:10px;border-radius:8px;background:#111827;border:1px solid #4b5563;color:#fff;box-sizing:border-box;">${SUPABASE_ANON_KEY.includes('YOUR_') ? '' : SUPABASE_ANON_KEY}</textarea>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button onclick="document.getElementById('configModal').remove()" style="padding:8px 16px;border-radius:8px;background:#4b5563;color:#fff;border:none;cursor:pointer;">닫기</button>
          <button onclick="saveSupabaseConfig()" style="padding:8px 20px;border-radius:8px;background:#ef4444;color:#fff;border:none;font-weight:bold;cursor:pointer;">저장 및 적용</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveSupabaseConfig() {
  const url = document.getElementById('inputSupabaseUrl').value.trim();
  const key = document.getElementById('inputSupabaseKey').value.trim();
  if (!url || !key) {
    alert("URL과 Key를 모두 입력해주세요.");
    return;
  }
  localStorage.setItem('FP_SUPABASE_URL', url);
  localStorage.setItem('FP_SUPABASE_ANON_KEY', key);
  alert("설정이 저장되었습니다! 화면을 새로고침합니다.");
  window.location.reload();
}
