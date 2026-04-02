import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce((accumulator, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return accumulator;
      }

      const delimiterIndex = trimmed.indexOf('=');
      if (delimiterIndex < 0) {
        return accumulator;
      }

      const key = trimmed.slice(0, delimiterIndex).trim();
      const rawValue = trimmed.slice(delimiterIndex + 1).trim();
      const normalizedValue = rawValue.replace(/^['"]|['"]$/g, '');
      accumulator[key] = normalizedValue;
      return accumulator;
    }, {});
}

function resolveEnv() {
  const cwd = process.cwd();
  return {
    ...parseEnvFile(path.join(cwd, '.env')),
    ...parseEnvFile(path.join(cwd, '.env.local')),
    ...process.env,
  };
}

function deriveProjectRef(supabaseUrl) {
  if (!supabaseUrl) {
    return '';
  }

  const hostname = new URL(supabaseUrl).hostname;
  return hostname.split('.')[0] ?? '';
}

function readTemplate(fileName) {
  const filePath = path.join(process.cwd(), 'supabase', 'templates', fileName);
  return fs.readFileSync(filePath, 'utf8');
}

function resolveOptionalSmtpConfig(env) {
  const requiredKeys = [
    'SUPABASE_SMTP_ADMIN_EMAIL',
    'SUPABASE_SMTP_HOST',
    'SUPABASE_SMTP_PORT',
    'SUPABASE_SMTP_USER',
    'SUPABASE_SMTP_PASS',
  ];

  const configuredKeys = requiredKeys.filter((key) => Boolean(env[key]));
  if (configuredKeys.length === 0) {
    return null;
  }

  const missingKeys = requiredKeys.filter((key) => !env[key]);
  if (missingKeys.length > 0) {
    throw new Error(`SMTP 설정이 일부만 들어있습니다. 다음 값을 모두 채워주세요: ${missingKeys.join(', ')}`);
  }

  return {
    external_email_enabled: true,
    mailer_secure_email_change_enabled: true,
    mailer_autoconfirm: false,
    smtp_admin_email: env.SUPABASE_SMTP_ADMIN_EMAIL,
    smtp_host: env.SUPABASE_SMTP_HOST,
    smtp_port: Number(env.SUPABASE_SMTP_PORT),
    smtp_user: env.SUPABASE_SMTP_USER,
    smtp_pass: env.SUPABASE_SMTP_PASS,
    smtp_sender_name: env.SUPABASE_SMTP_SENDER_NAME?.trim() || env.VITE_APP_NAME?.trim() || 'Handover HQ',
  };
}

async function patchAuthConfig(projectRef, accessToken, payload) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase Auth 설정 업데이트 실패 (${response.status}): ${errorText}`);
  }
}

async function main() {
  const env = resolveEnv();
  const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef = env.SUPABASE_PROJECT_REF?.trim() || deriveProjectRef(env.VITE_SUPABASE_URL?.trim());

  if (!accessToken) {
    throw new Error('SUPABASE_ACCESS_TOKEN을 설정한 뒤 다시 실행해주세요.');
  }

  if (!projectRef) {
    throw new Error('SUPABASE_PROJECT_REF 또는 VITE_SUPABASE_URL이 필요합니다.');
  }

  const appName = env.VITE_APP_NAME?.trim() || 'Handover HQ';
  const smtpConfig = resolveOptionalSmtpConfig(env);

  const payload = {
    mailer_subjects_confirmation: `[${appName}] 회원가입을 완료해주세요`,
    mailer_subjects_magic_link: `[${appName}] 로그인 링크가 도착했어요`,
    mailer_templates_confirmation_content: readTemplate('confirm-signup.html'),
    mailer_templates_magic_link_content: readTemplate('magic-link.html'),
    ...smtpConfig,
  };

  await patchAuthConfig(projectRef, accessToken, payload);

  console.log(`[done] ${projectRef} 프로젝트의 Auth 이메일 설정을 업데이트했습니다.`);
  if (smtpConfig) {
    console.log('[done] Custom SMTP 설정도 함께 반영했습니다.');
  } else {
    console.log('[info] SMTP 환경변수가 없어 메일 본문/제목만 반영했습니다. 발신자 이름은 여전히 Supabase Auth로 보일 수 있습니다.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
