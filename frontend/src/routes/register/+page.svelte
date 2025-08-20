<script>
    import { goto } from '$app/navigation';

    let email = "";
    let name = "";
    let password = "";
    let confirmPassword = "";
    let passwordMatch = true;
    let errorMessage = "";

    // 비밀번호 일치 여부 체크
    $: passwordMatch = password === confirmPassword;

    async function handleRegister() {
        errorMessage = "";

        if (!passwordMatch) {
            errorMessage = "비밀번호가 일치하지 않습니다.";
            return;
        }
        if (!email || !name || !password) {
            errorMessage = "모든 항목을 입력해주세요.";
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/user/Register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    name,
                    password
                }),
            });

            if (!response.ok) {
                throw new Error("서버와 통신할 수 없습니다.");
            }

            const result = await response.json();
            console.log("서버 응답:", result);

            if (result.RESULT === "success") {
                alert("회원가입이 완료되었습니다!");
                goto("/login"); // 로그인 페이지로 이동
            } else {
                errorMessage = result.error_msg || "알 수 없는 오류가 발생했습니다.";
            }
        } catch (err) {
            console.error(err);
            errorMessage = "네트워크 오류가 발생했습니다.";
        }
    }
</script>

<style>
    .register-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
    }

    .register-box {
        background: white;
        padding: 2rem;
        border-radius: 0.75rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        width: 100%;
        max-width: 400px;
    }

    .register-title {
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

    .password-check {
        font-size: 0.9rem;
        margin-top: 0.25rem;
    }

    .error-message {
        color: red;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        text-align: center;
    }

    .register-button {
        width: 100%;
        background-color: #16a34a; /* 초록색 */
        color: white;
        padding: 0.75rem;
        border-radius: 0.5rem;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s ease;
        border: none;
    }

    .register-button:hover:enabled {
        background-color: #15803d;
    }

    .register-button:disabled {
        background-color: #9ca3af; /* 회색 */
        cursor: not-allowed;
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

<div class="register-container">
    <div class="register-box">
        <div class="register-title">회원가입</div>

        <div class="input-group">
            <label for="email">이메일</label>
            <input id="email" type="email" bind:value={email} placeholder="이메일을 입력하세요" />
        </div>

        <div class="input-group">
            <label for="name">이름</label>
            <input id="name" type="text" bind:value={name} placeholder="이름을 입력하세요" />
        </div>

        <div class="input-group">
            <label for="password">비밀번호</label>
            <input id="password" type="password" bind:value={password} placeholder="비밀번호를 입력하세요" />
        </div>

        <div class="input-group">
            <label for="confirmPassword">비밀번호 확인</label>
            <input id="confirmPassword" type="password" bind:value={confirmPassword} placeholder="비밀번호를 다시 입력하세요" />
            {#if confirmPassword.length > 0}
                <div class="password-check" style="color: {passwordMatch ? 'green' : 'red'}">
                    {passwordMatch ? "비밀번호가 일치합니다 " : "비밀번호가 일치하지 않습니다 "}
                </div>
            {/if}
        </div>

        {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
        {/if}

        <button class="register-button" on:click={handleRegister} disabled={!passwordMatch}>
            회원가입
        </button>

        <div class="extra-links">
            <a href="/login">로그인으로 돌아가기</a>
        </div>
    </div>
</div>
