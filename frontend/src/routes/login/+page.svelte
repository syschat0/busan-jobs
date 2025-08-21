<script>
    import { goto } from '$app/navigation';
    import { userInfo } from '$lib/stores/userStore.ts';
	const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
	
    let email = "";
    let password = "";
    let errorMessage = "";

    async function handleLogin() {
        errorMessage = "";

        if (!email || !password) {
            errorMessage = "이메일과 비밀번호를 입력해주세요.";
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/user/Login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password
                }),
                credentials: "include"   // 세션 쿠키임. 나중에 다른분들 요청하는거 이거 복붙
            });

            if (!response.ok) {
                throw new Error("서버와 통신할 수 없습니다.");
            }

            const result = await response.json();
            console.log("서버 응답:", result);

            if (result.RESULT === "OK") {
                //alert("로그인이 완료되었습니다!");
                userInfo.set({ name: result.name, email: result.email });
                goto("/");
            } else {
                errorMessage = "아이디 또는 패스워드가 일치하지 않습니다.";
            }
        } catch (err) {
            console.error(err);
            errorMessage = "네트워크 오류가 발생했습니다.";
        }
    }
</script>

<style>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
    }

    .login-box {
        background: white;
        padding: 2rem;
        border-radius: 0.75rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        width: 100%;
        max-width: 400px;
    }

    .login-title {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .input-group {
        margin-bottom: 1rem;
    }

    .input-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }

    .input-group input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 0.5rem;
        font-size: 1rem;
    }

    .login-button {
        width: 100%;
        background-color: #4f46e5; /* 인디고 */
        color: white;
        padding: 0.75rem;
        border-radius: 0.5rem;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s ease;
        border: none;
    }

    .login-button:hover {
        background-color: #4338ca;
    }

    .error-message {
        color: red;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        text-align: center;
    }

    .extra-links {
        margin-top: 1rem;
        text-align: center;
        font-size: 0.9rem;
    }

    .extra-links a {
        color: #4f46e5;
        text-decoration: none;
        margin: 0 0.5rem;
    }

    .extra-links a:hover {
        text-decoration: underline;
    }
</style>

<div class="login-container">
    <div class="login-box">
        <div class="login-title">로그인</div>

        <div class="input-group">
            <label for="email">이메일</label>
            <input id="email" type="email" bind:value={email} placeholder="이메일을 입력하세요" />
        </div>

        <div class="input-group">
            <label for="password">비밀번호</label>
            <input id="password" type="password" bind:value={password} placeholder="비밀번호를 입력하세요" 
                on:keydown={(e) => e.key === 'Enter' && handleLogin()}/>
        </div>

        {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
        {/if}

        <button class="login-button" on:click={handleLogin}>
            로그인
        </button>

        <div class="extra-links">
            <a href="/register">회원가입</a> | <a href="/forgot">비밀번호 찾기</a>
        </div>
    </div>
</div>
