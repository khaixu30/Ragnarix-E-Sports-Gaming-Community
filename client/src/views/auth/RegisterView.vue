<template>
  <div class="signup-container">
    <!-- Left Side -->
    <div class="left-section">
      <div class="logo-box">
        <span>⚡</span>
      </div>

      <h1>Join Fragmint</h1>

      <p>
        Start your gaming journey today. Compete,
        connect, and conquer with the best community
        in gaming.
      </p>
    </div>

    <!-- Right Side -->
    <div class="right-section">
      <div class="form-box">
        <h2>Create Account</h2>
        <p class="subtitle">Sign up to start your gaming journey</p>

        <form @submit.prevent="handleSignup">
          <input
            type="text"
            v-model="form.username"
            placeholder="Username"
            maxlength="25"
            required
          />

          <input
            type="text"
            v-model="form.full_name"
            placeholder="Full Name"
            maxlength="50"
            required
          />

          <input
            type="email"
            v-model="form.email"
            placeholder="you@example.com"
            required
          />

          <input
            type="tel"
            v-model="form.phone_number"
            placeholder="Phone Number"
          />

          <textarea
            v-model="form.about_info"
            placeholder="About Info"
          ></textarea>

          <input
            type="password"
            v-model="form.password"
            placeholder="Password"
            required
          />

          <input
            type="password"
            v-model="form.confirmPassword"
            placeholder="Confirm Password"
            required
          />

          <button type="submit">Create Account</button>
        </form>

        <div class="divider">
          <span>Or continue with</span>
        </div>

        <div class="social-buttons">
          <button class="social-btn">GitHub</button>
          <button class="social-btn">Google</button>
        </div>

        <p class="signin-text">
          Already have an account?
          <a href="#">Sign in</a>
        </p>
      </div>
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
  username: '',
  full_name: '',
  email: '',
  phone_number: '',
  password: '',
  confirmPassword: ''
})

const handleSignup = async () => {
  error.value = ''  // ✅ Fix 4: clear stale errors on each attempt

  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return  // loading never started, so no need for finally here
  }

  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'  // ✅ Fix 1a: tell server it's JSON
      },
      body: JSON.stringify({                // ✅ Fix 1b: serialize the object
        username: form.value.username,
        full_name: form.value.full_name,
        email: form.value.email,
        phone_number: form.value.phone_number,
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


.signup-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #0d0d0d,
    #141414,
    #1f1205
  );
  color: white;
}

/* LEFT SIDE */
.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px;
  text-align: center;
  background: radial-gradient(
    circle at center,
    rgba(255, 136, 0, 0.15),
    transparent 70%
  );
}

.logo-box {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff7b00, #ffae00);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: 30px;
  color: black;
  box-shadow: 0 0 25px rgba(255, 123, 0, 0.5);
}

.left-section h1 {
  font-size: 60px;
  font-weight: 800;
  color: #ffb347;
  margin-bottom: 20px;
}

.left-section p {
  font-size: 20px;
  max-width: 500px;
  color: #c9c9c9;
  line-height: 1.8;
}

/* RIGHT SIDE */
.right-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.form-box {
  width: 100%;
  max-width: 500px;
}

.form-box h2 {
  font-size: 38px;
  margin-bottom: 10px;
  color: #ffb347;
}

.subtitle {
  color: #999;
  margin-bottom: 30px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

input,
select,
textarea {
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 136, 0, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 15px;
  transition: 0.3s;
}

textarea {
  min-height: 100px;
  resize: none;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #ff8800;
  box-shadow: 0 0 12px rgba(255, 136, 0, 0.4);
}

input::placeholder,
textarea::placeholder {
  color: #777;
}

select {
  color: #ccc;
}

button[type="submit"] {
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff7b00, #ffb700);
  color: black;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
  box-shadow: 0 0 20px rgba(255, 136, 0, 0.4);
}

button[type="submit"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(255, 136, 0, 0.7);
}

.divider {
  margin: 30px 0;
  text-align: center;
  position: relative;
  color: #777;
}

.divider::before,
.divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 35%;
  height: 1px;
  background: #333;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.social-buttons {
  display: flex;
  gap: 15px;
}

.social-btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #333;
  background: #111;
  color: white;
  cursor: pointer;
  transition: 0.3s;
}

.social-btn:hover {
  background: #1f1f1f;
  border-color: #ff8800;
}

.signin-text {
  margin-top: 25px;
  text-align: center;
  color: #888;
}

.signin-text a {
  color: #ff9900;
  text-decoration: none;
}

.signin-text a:hover {
  text-decoration: underline;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .signup-container {
    flex-direction: column;
  }

  .left-section {
    padding: 40px 20px;
  }

  .left-section h1 {
    font-size: 42px;
  }

  .left-section p {
    font-size: 16px;
  }
}
</style>