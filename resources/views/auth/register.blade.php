@include('include.header')



    <section class="hero">
        <div class="hero-body">
		

				
            <div class="container has-text-centered">
			

			
                <div class="column is-4 is-offset-4">
				
		
				
                    <h3 class="title has-text-black">Sign-up</h3>
                    <hr class="login-hr">
                    <div class="box">
                        <form method="POST" action="/register">
						@csrf
                            <div class="field">
                                <div class="control">
                                    <input class="input is-large" name="email" type="email" placeholder="Your Email" autofocus="" value="{{ old('email') }}">
                                </div>
                            </div>
							
							<div class="field">
                                <div class="control">
                                    <input class="input is-large" name="name" type="text" placeholder="Your name" autofocus="" value="{{ old('name') }}">
                                </div>
                            </div>

							
                            <div class="field">
                                <div class="control">
                                    <input class="input is-large" name="password" type="password" placeholder="Your Password"  value="{{ old('password') }}">
                                </div>
                            </div>
							
							
							
							
                            <button class="button is-block is-success is-large is-fullwidth">Create account <i class="fas fa-user-plus"></i></button>
                        </form>
                    </div>
                    <p class="has-text-grey">
                        <a href="/login">Sign In</a> &nbsp;·&nbsp;
                        <a href="/forgot-password">Forgot Password</a> &nbsp;·&nbsp;
                    </p>
                </div>
            </div>
        </div>
    </section>
@include('include.footer')