-- ========================================================
-- 소방 현장 1차 통제선 안전관리 시스템 (FirePass) DDL
-- Supabase SQL Editor에 복사하여 [RUN] 버튼을 누르세요.
-- ========================================================

-- 1. 기존 테이블 정리 (초기화 필요시)
DROP TABLE IF EXISTS entry_exit_logs CASCADE;
DROP TABLE IF EXISTS firefighters CASCADE;
DROP TABLE IF EXISTS incident_scenes CASCADE;

-- 2. 소방대원 마스터 테이블
CREATE TABLE firefighters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_number VARCHAR(50) DEFAULT NULL,    -- 사번 (선택사항 또는 미사용)
    qr_token VARCHAR(64) UNIQUE NOT NULL,       -- QR 코드 인코딩 난수 토큰
    name VARCHAR(50) NOT NULL,                  -- 대원 성명
    rank VARCHAR(30) NOT NULL,                  -- 계급 (소방사, 소방교, 소방장, 소방위 등)
    team_name VARCHAR(50) NOT NULL,             -- 소속 팀 (진압1팀, 구조대, 구급대 등)
    phone VARCHAR(20),                          -- 연락처 (선택)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 출동 현장 테이블
CREATE TABLE incident_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,                 -- 현장 명칭 (예: 역삼동 상가 화재)
    time_limit_minutes INT DEFAULT 35,          -- 기본 체류 제한시간 (분 단위)
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 4. 출입 통제 이벤트 로그 테이블 (오프라인 동기화 대상)
CREATE TABLE entry_exit_logs (
    id UUID PRIMARY KEY,                         -- 클라이언트(웹/앱)에서 생성한 UUID
    scene_id UUID REFERENCES incident_scenes(id) ON DELETE CASCADE NOT NULL,
    firefighter_id UUID REFERENCES firefighters(id) ON DELETE CASCADE,
    qr_token VARCHAR(64) NOT NULL,               -- 스캔된 QR 토큰 원본
    action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('ENTRY', 'EXIT')), -- 진입 / 철수
    location VARCHAR(50) DEFAULT '미지정',        -- 활동 방면/구역 (1방면, 2방면, 3방면, 4방면, 내부 등)
    tagged_at TIMESTAMPTZ NOT NULL,              -- 실제 현장에서 태깅된 시간
    is_manual BOOLEAN DEFAULT FALSE,             -- QR 미인식 등으로 인한 수동 입력 여부
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- (기존 테이블에 방면 컬럼만 추가하려면 아래 1줄 실행):
-- ALTER TABLE entry_exit_logs ADD COLUMN IF NOT EXISTS location VARCHAR(50) DEFAULT '미지정';

-- 빠른 조회를 위한 인덱스 생성
CREATE INDEX idx_logs_scene_id ON entry_exit_logs(scene_id);
CREATE INDEX idx_logs_tagged_at ON entry_exit_logs(tagged_at DESC);
CREATE INDEX idx_firefighters_qr ON firefighters(qr_token);

-- 5. Row Level Security (RLS) 및 역할 권한 (GRANT) 설정
-- 웹 클라이언트(anon, authenticated)가 REST API로 데이터를 조회하고 쓸 수 있도록 권한 부여
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

ALTER TABLE firefighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_exit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for firefighters" ON firefighters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for incident_scenes" ON incident_scenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for entry_exit_logs" ON entry_exit_logs FOR ALL USING (true) WITH CHECK (true);

-- 6. Supabase Realtime (실시간 이벤트 브로드캐스팅) 활성화
-- 현장지휘관 대시보드가 새로고침 없이 출입 이벤트를 즉시 수신하도록 설정합니다.
ALTER PUBLICATION supabase_realtime ADD TABLE entry_exit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE incident_scenes;

-- 7. 테스트용 초기 데이터 삽입
-- 1) 기본 활성화 현장 1건 생성
INSERT INTO incident_scenes (id, title, time_limit_minutes, status)
VALUES ('11111111-1111-1111-1111-111111111111', '역삼119 관내 테스트 화재현장', 35, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 2) 테스트 대원 5명 등록
INSERT INTO firefighters (service_number, qr_token, name, rank, team_name)
VALUES 
('2024-001', 'FP:v1:token-kim-001', '김진압', '소방교', '진압1팀'),
('2024-002', 'FP:v1:token-lee-002', '이구조', '소방장', '119구조대'),
('2024-003', 'FP:v1:token-park-003', '박구급', '소방교', '구급대'),
('2024-004', 'FP:v1:token-choi-004', '최팀장', '소방위', '지휘조사팀'),
('2024-005', 'FP:v1:token-jung-005', '정안전', '소방사', '진압2팀')
ON CONFLICT (service_number) DO NOTHING;
