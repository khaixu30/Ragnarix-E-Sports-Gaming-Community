<template>
  <div class="container">
    <!-- Left Section -->
    <div class="left">
      <div class="logo">
        ⚡
      </div>
      <h1 class="highlight-heading">Fraqmint</h1>
      <p>
        Your gaming community awaits. Connect with players, compete in tournaments,
        and dominate the leaderboards.
      </p>
    </div>

    <!-- Right Section -->
    <div class="right">
      <h2>Welcome Back</h2>
      <p class="subtitle">Enter your credentials to access your account</p>
      <form @submit.prevent="handlelogin">

        <input type="email" v-model="form.email" placeholder="you@example.com" />
        <div class="password-row">
          <input type="password" v-model="form.password" placeholder="••••••••" />
          <span class="forgot">Forgot password?</span>
        </div>
        
        <button type="submit" class="signin-btn">Sign In</button>
        
      </form>
        <div class="divider">
        <span>Or continue with</span>
      </div>

      <div class="socials">
        <button>GitHub</button>
        <button>Google</button>
      </div>

      <p class="signup">
        Don't have an account? <span>Sign up</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const form = ref({
  email: '',
  password: ''
})

const handlelogin = async () => {
  error.value = ''  // ✅ Fix 4: clear stale errors on each attempt

  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'  // ✅ Fix 1a: tell server it's JSON
      },
      body: JSON.stringify({                // ✅ Fix 1b: serialize the object
        email: form.value.email,
        password: form.value.password
        // ✅ confirmPassword intentionally excluded — don't send to server
      })
    })

    if (!response.ok) {
      error.value = `Request failed with status: ${response.status}`
      return
    }

    const data = await response.json()
    console.log(data)
    const token = data.token
    localStorage.setItem('token', token)
    router.push('/dashboard')

  } catch (err) {  // ✅ Fix 2: renamed to `err` so it doesn't shadow error ref
    error.value = 'Network error. Please try again.'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>

/* Layout */
.container {
  display: flex;
  height: 100vh;
  background: black;
  color: white;
}

/* LEFT SIDE */
.left {
  flex: 1;
  background: url('../../assets/backgrounds/login-bg.jpg');
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
  background-size: cover;
  background-position: center;
  
}

.logo {
  width: 60px;
  height: 60px;
  background: var(--primary-color);
  color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 28px;
  margin-bottom: 20px;
}

.left h1 {
  font-size: 42px;
  margin-bottom: 15px;
}

.left p {
  max-width: 400px;
  color: #ccc;
  line-height: 1.6;
}

/* RIGHT SIDE */
.right {
  flex: 1;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
}

.right h2 {
  margin-bottom: 10px;
}

.subtitle {
  color: #aaa;
  margin-bottom: 20px;
}

/* Inputs */
input {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border-radius: 8px;
  border: 1px solid #333;
  background: #111;
  color: white;
}

input:focus {
  outline: none;
  border-color: #ff7a00;
}

/* Password row */
.password-row {
  position: relative;
}

.forgot {
  position: absolute;
  right: 10px;
  top: -20px;
  font-size: 12px;
  color: #ff7a00;
  cursor: pointer;
}

/* Button */
.signin-btn {
  background: #ff7a00;
  color: black;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
  font-weight: bold;
}

.signin-btn:hover {
  background: #ff9a33;
}

/* Divider */
.divider {
  text-align: center;
  margin: 20px 0;
  color: #777;
  position: relative;
}

.divider span {
  background: #0a0a0a;
  padding: 0 10px;
}

/* Social buttons */
.socials {
  display: flex;
  gap: 10px;
}

.socials button {
  flex: 1;
  padding: 10px;
  background: #111;
  border: 1px solid #333;
  color: white;
  border-radius: 8px;
  cursor: pointer;
}

.socials button:hover {
  border-color: #ff7a00;
}

/* Signup */
.signup {
  margin-top: 20px;
  color: #aaa;
}

.signup span {
  color: #ff7a00;
  cursor: pointer;
}
</style>