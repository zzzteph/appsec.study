@include('include.header')
    <section class="hero">
        <div class="hero-body">
            <div class="container has-text-centered">
                <div class="column is-4 is-offset-4">

				
				
                    <h3 class="title has-text-black">Create new password</h3>
                    <hr class="login-hr">
                    <div class="box">
                        <form method="POST" action="/reset-password">
						@csrf
                            <div class="field">
							
							  <input  type="hidden" name="token" value="{{$token}}">
							
							                                <div class="control">
                                    <input class="input is-large" type="email" name="email" placeholder="Email" autofocus="">
                                </div>
							</div>
							 <div class="field">
                                <div class="control">
                                    <input class="input is-large" type="password" name="password" placeholder="Password" autofocus="">
                                </div>
								 </div>
								 <div class="field">
								                                <div class="control">
                                    <input class="input is-large" type="password" name="password_confirmation" placeholder="Confirm" autofocus="">
                                </div>
								
                            </div>
							  </div>
                            <button class="button is-block is-success is-large is-fullwidth">Update password <i class="fas fa-sign-in-alt"></i></button>
                        </form>

						
						
                    </div>
                    <p class="has-text-grey">
                        <a href="/register">Sign Up</a> &nbsp;·&nbsp;
                        <a href="/restore">Forgot Password</a> &nbsp;·&nbsp;
                    </p>
                </div>
            </div>
        </div>
    </section>
@include('include.footer')