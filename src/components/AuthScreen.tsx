import { useState } from 'react';
import { cn } from './UI';
import {
  activateInviteOrRecover,
  grantLicenseLocally,
  isInviteCodeRequired,
  login,
  register,
  type AuthSession,
} from '../utils/authClient';

type Props = {
  onAuthed: (session: AuthSession, isNewUser?: boolean) => Promise<void> | void;
  /** 弹层模式：不占满整屏，便于嵌在遮罩内 */
  embedded?: boolean;
  onDismiss?: () => void;
};

export default function AuthScreen({ onAuthed, embedded, onDismiss }: Props) {
  const inviteRequired = isInviteCodeRequired();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submitAuth = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const uname = username.trim().toLowerCase();
      const authCode = code.trim().toUpperCase();

      if (mode === 'register') {
        if (inviteRequired && !authCode) {
          setMsg('注册需要授权码完成激活，请填写后再继续。');
          return;
        }
        if (password.length < 6) {
          setMsg('密码至少需 6 位。');
          return;
        }
        if (password !== confirmPassword) {
          setMsg('两次输入的密码不一致，请重新确认。');
          return;
        }

        const s = await register(uname, password);
        if (inviteRequired) {
          const updated = await activateInviteOrRecover(s, authCode);
          await onAuthed(updated, true);
        } else {
          const updated = grantLicenseLocally(s);
          await onAuthed(updated, true);
        }
      } else {
        const s = await login(uname, password);

        if (s.user.licenseActivated) {
          await onAuthed(s, false);
          return;
        }

        if (inviteRequired) {
          if (!authCode) {
            setMsg('该账号尚未激活，请填写授权码完成激活；若已激活过，请稍后再试或联系客服同步权限。');
            return;
          }
          const updated = await activateInviteOrRecover(s, authCode);
          await onAuthed(updated, false);
        } else {
          const updated = grantLicenseLocally(s);
          await onAuthed(updated, false);
        }
      }
    } catch (e: any) {
      if (e?.message?.includes('activated_with_code')) {
        setMsg('数据库正在同步权限，请在 2 秒后点击“登录”。');
      } else {
        setMsg(e?.message || '操作失败');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        'relative w-full bg-[radial-gradient(100%_100%_at_0%_0%,#f7f3ec_0%,#efe9df_62%,#e8e1d6_100%)] flex items-center justify-center overflow-hidden',
        embedded
          ? 'min-h-0 max-h-[min(90dvh,820px)] py-4 px-3 md:px-5 rounded-[2rem]'
          : 'min-h-[100dvh] p-4 md:p-6'
      )}
    >
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#dfd4c8] bg-[#fbf7f1]/90 text-[#8c8881] shadow-sm hover:bg-white hover:text-[#5c4030] transition"
          aria-label="关闭"
        >
          ×
        </button>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(80,58,39,0.26) 1px, transparent 0)',
          backgroundSize: '7px 7px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, rgba(120,88,58,0.10) 0 1px, transparent 1px 8px), repeating-linear-gradient(25deg, rgba(120,88,58,0.08) 0 1px, transparent 1px 9px)',
          mixBlendMode: 'multiply',
        }}
      />
      <div className="w-full max-w-md md:max-w-lg rounded-[2.2rem] md:rounded-[2.6rem] border border-[#d8cab8] bg-[linear-gradient(180deg,#fbf7f1_0%,#f4ede3_100%)] shadow-[0_28px_70px_-34px_rgba(111,83,58,0.45)] overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#d6b390] via-[#b58362] to-[#d6b390]" />
        <div className="p-5 md:p-7">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -top-1 -right-1 h-14 w-14 md:h-16 md:w-16 rotate-[8deg] rounded-2xl border border-[#c79b76]/65 bg-[radial-gradient(circle_at_30%_25%,#e9c8a6,#b58362_55%,#8f6848_100%)] shadow-[0_8px_20px_-10px_rgba(90,60,35,0.5)]"
            >
              <div className="h-full w-full rounded-2xl flex items-center justify-center">
                <div className="text-[10px] md:text-[11px] font-serif font-bold text-white/90 tracking-[0.08em] drop-shadow-[0_2px_4px_rgba(90,60,35,0.35)]">
                  NUO
                </div>
              </div>
            </div>
            <div
              aria-hidden
              className="absolute top-4 right-4 h-6 w-6 md:top-5 md:right-5 md:h-7 md:w-7 rounded-full border border-white/45 bg-white/10"
            />
          </div>
          <div className="rounded-[1.8rem] md:rounded-[2.1rem] border border-[#e7dccf] bg-[#fbf7f1]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] px-4 py-6 md:px-6 md:py-8 space-y-4 md:space-y-5">
            <div className="text-center space-y-1">
              <h1 className="text-[2rem] md:text-[2.35rem] font-serif font-bold text-[#2c2417] tracking-wide">登录</h1>
              <p className="text-[11px] md:text-xs text-[#8c8881] leading-relaxed">
                {!inviteRequired ? (
                  <>
                    当前为<strong className="font-semibold text-[#5c5348]">开放注册</strong>
                    ：只需手机号与密码。授权码由后台单独管理，本应用不负责生成。
                  </>
                ) : mode === 'login' ? (
                  <>
                    已激活账号：<strong className="font-semibold text-[#5c5348]">手机号 + 密码</strong>即可登录。
                    邀请码在后台生成并入库，填错或未入库会提示无效。
                  </>
                ) : (
                  <>注册需有效邀请码完成激活；数据按账号隔离保存。</>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-[#f4ede4] rounded-2xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-white text-[#2c2417] shadow-sm' : 'text-[#8c8881]'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                mode === 'register' ? 'bg-white text-[#2c2417] shadow-sm' : 'text-[#8c8881]'
              }`}
            >
              注册
            </button>
            </div>

            <div className="space-y-3">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="手机号（作为登录账号）"
                inputMode="tel"
                className="w-full rounded-full border border-[#dfd4c8] bg-[#f7f1e8] px-4 py-3 text-base outline-none focus:border-[#b58362] shadow-[0_8px_18px_-14px_rgba(117,86,61,0.45)]"
              />
              <input
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="登录密码（至少 6 位）"
                className="w-full rounded-full border border-[#dfd4c8] bg-[#f7f1e8] px-4 py-3 text-base outline-none focus:border-[#b58362] shadow-[0_8px_18px_-14px_rgba(117,86,61,0.45)]"
              />
              {mode === 'register' && (
                <input
                  value={confirmPassword}
                  type="password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="确认密码（再次输入上面的密码）"
                  className="w-full rounded-full border border-[#dfd4c8] bg-[#f7f1e8] px-4 py-3 text-base outline-none focus:border-[#b58362] shadow-[0_8px_18px_-14px_rgba(117,86,61,0.45)]"
                />
              )}
              {inviteRequired && (
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={
                    mode === 'login'
                      ? '邀请码（未激活账号必填，已激活可留空）'
                      : '邀请码（注册必填）'
                  }
                  autoComplete="off"
                  className="w-full rounded-full border border-[#dfd4c8] bg-[#f7f1e8] px-4 py-3 text-base outline-none focus:border-[#b58362] shadow-[0_8px_18px_-14px_rgba(117,86,61,0.45)]"
                />
              )}
              <button
                onClick={submitAuth}
                disabled={
                  busy ||
                  !username.trim() ||
                  password.length < 6 ||
                  (mode === 'register' &&
                    ((inviteRequired && !code.trim()) || password !== confirmPassword))
                }
                className="w-full rounded-full bg-[#b58362] text-white py-3 text-base font-semibold shadow-[0_14px_30px_-18px_rgba(117,86,61,0.65)] hover:brightness-95 active:scale-[0.99] disabled:opacity-60 transition"
              >
                {busy ? '处理中...' : mode === 'login' ? '登录' : '注册并登录'}
              </button>
            </div>

            <p className="text-[11px] text-[#9a8f83] text-center">
              {!inviteRequired
                ? '邀请码须在服务端或管理后台生成并写入数据库，与应用内无关'
                : mode === 'login'
                  ? '老用户登录不必再填邀请码（除非账号在后台仍为未激活）'
                  : '首次使用请先注册'}
            </p>
          </div>
          {msg && <div className="mt-4 text-sm text-center text-[#8b5a3c] bg-[#fff7ee] rounded-xl py-2.5 px-3">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
