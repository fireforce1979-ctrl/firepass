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

// ==========================================
// 6. 훈련 / 출동 현장(방) 관리 유틸리티
// ==========================================
function getActiveScene() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramId = urlParams.get('scene');
  const paramTitle = urlParams.get('title');

  if (paramId) {
    localStorage.setItem('FP_SCENE_ID', paramId);
    if (paramTitle) localStorage.setItem('FP_SCENE_TITLE', decodeURIComponent(paramTitle));
    return { id: paramId, title: paramTitle ? decodeURIComponent(paramTitle) : '현장 훈련' };
  }

  const savedId = localStorage.getItem('FP_SCENE_ID') || DEFAULT_SCENE_ID;
  const savedTitle = localStorage.getItem('FP_SCENE_TITLE') || '역삼119 관내 테스트 현장';
  return { id: savedId, title: savedTitle };
}

function setActiveScene(id, title) {
  localStorage.setItem('FP_SCENE_ID', id);
  localStorage.setItem('FP_SCENE_TITLE', title);
  
  // URL 파라미터 갱신 및 새로고침
  const url = new URL(window.location.href);
  url.searchParams.set('scene', id);
  url.searchParams.set('title', encodeURIComponent(title));
  window.location.href = url.toString();
}

async function openSceneModal() {
  const client = (typeof getSafeSupabaseClient === 'function' ? getSafeSupabaseClient() : getSupabaseClient());
  let scenesListHtml = '<div class="text-xs text-gray-400 p-4 text-center">훈련 방 목록을 불러오는 중...</div>';
  
  const modalId = 'sceneSelectModal';
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const modalHtml = `
    <div id="${modalId}" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;">
      <div style="background:#1f2937;color:#fff;padding:24px;border-radius:20px;max-width:540px;width:100%;border:1px solid #374151;font-family:sans-serif;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
        
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#ef4444;display:flex;align-items:center;gap:8px;">
            <span>🏢</span> 훈련 / 출동 방 선택
          </h2>
          <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;color:#9ca3af;font-size:1.5rem;cursor:pointer;">✕</button>
        </div>
        
        <p style="font-size:0.8rem;color:#9ca3af;margin-bottom:16px;">
          새로운 훈련 시 새 방을 생성하면 이전 기록과 섞이지 않고 깨끗한 상태로 시작할 수 있습니다.
        </p>

        <!-- 1. 새 훈련 방 생성 폼 -->
        <div style="background:#111827;padding:14px;border-radius:14px;border:1px solid #374151;margin-bottom:16px;">
          <div style="font-size:0.75rem;font-weight:bold;color:#f87171;margin-bottom:6px;">➕ 새로운 훈련 / 출동 방 만들기</div>
          <div style="display:flex;gap:6px;">
            <input id="inputNewSceneTitle" type="text" placeholder="예: 9월 정기 소방훈련, 2팀 구조훈련" 
                   style="flex:1;padding:10px 12px;border-radius:8px;background:#1f2937;border:1px solid #4b5563;color:#fff;font-size:0.875rem;" />
            <button onclick="createNewScene()" 
                    style="padding:10px 16px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-weight:bold;font-size:0.875rem;cursor:pointer;white-space:nowrap;">
              방 생성
            </button>
          </div>
        </div>

        <!-- 2. 진행 중인 훈련 방 목록 -->
        <div style="font-size:0.75rem;font-weight:bold;color:#d1d5db;margin-bottom:8px;">📋 진행 중인 훈련 방 목록</div>
        <div id="sceneListContainer" style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
          ${scenesListHtml}
        </div>

        <div style="display:flex;justify-content:flex-end;">
          <button onclick="document.getElementById('${modalId}').remove()" 
                  style="padding:8px 18px;border-radius:8px;background:#4b5563;color:#fff;border:none;cursor:pointer;font-size:0.875rem;">
            닫기
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Supabase에서 방 목록 조회
  if (client) {
    try {
      const { data, error } = await client
        .from('incident_scenes')
        .select('*')
        .order('created_at', { ascending: false });

      const container = document.getElementById('sceneListContainer');
      const current = getActiveScene();

      if (data && data.length > 0) {
        container.innerHTML = data.map(s => {
          const isSelected = s.id === current.id;
          const createdDate = new Date(s.created_at).toLocaleDateString();
          return `
            <div onclick="selectScene('${s.id}', '${s.title.replace(/'/g, "\\'")}')" 
                 style="padding:12px;border-radius:10px;background:${isSelected ? '#374151' : '#111827'};border:1px solid ${isSelected ? '#ef4444' : '#374151'};display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:all 0.2s;">
              <div>
                <div style="font-weight:bold;font-size:0.9rem;color:${isSelected ? '#f87171' : '#fff'};">
                  ${isSelected ? '✔ ' : ''}${s.title}
                </div>
                <div style="font-size:0.7rem;color:#9ca3af;margin-top:2px;">개설일: ${createdDate}</div>
              </div>
              <span style="font-size:0.75rem;padding:4px 8px;border-radius:6px;background:${isSelected ? '#ef4444' : '#4b5563'};color:#fff;font-weight:bold;">
                ${isSelected ? '현재 방' : '들어가기'}
              </span>
            </div>
          `;
        }).join('');
      } else {
        container.innerHTML = '<div style="font-size:0.8rem;color:#9ca3af;text-align:center;padding:16px;">개설된 방이 없습니다. 상단에서 새로 만들어보세요.</div>';
      }
    } catch (e) {
      document.getElementById('sceneListContainer').innerHTML = '<div style="font-size:0.8rem;color:#ef4444;text-align:center;padding:16px;">목록 조회 오류: ' + e.message + '</div>';
    }
  }
}

async function createNewScene() {
  const input = document.getElementById('inputNewSceneTitle');
  const title = input ? input.value.trim() : '';
  if (!title) {
    alert("훈련 방 이름을 입력해주세요 (예: 9월 화재진압훈련)");
    return;
  }

  const client = (typeof getSafeSupabaseClient === 'function' ? getSafeSupabaseClient() : getSupabaseClient());
  if (!client) {
    alert("Supabase 연결이 필요합니다.");
    return;
  }

  const newId = crypto.randomUUID();
  const { data, error } = await client.from('incident_scenes').insert([{
    id: newId,
    title: title,
    time_limit_minutes: 30,
    status: 'ACTIVE'
  }]).select();

  if (error) {
    alert("방 생성 실패: " + error.message);
  } else {
    alert(`[${title}] 훈련 방이 생성되었습니다! 새 방으로 이동합니다.`);
    setActiveScene(newId, title);
  }
}

function selectScene(id, title) {
  setActiveScene(id, title);
}
