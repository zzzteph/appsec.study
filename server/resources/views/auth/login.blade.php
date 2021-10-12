@include('include.header')
    <section class="hero">
        <div class="hero-body">
            <div class="container has-text-centered">
                <div class="column is-4 is-offset-4">
                    <h3 class="title has-text-black">Sign-in</h3>
																		
                                <div class="row">
                                  
									  <a href="/auth/google/redirect" class="button is-large  is-fullwidth">  <i class="fab fa-google"> </i>&nbsp;with Google</a>
                                </div>
												
					
                    <hr class="login-hr">
                    <p class="subtitle has-text-black">Please login to proceed.</p>
                    <div class="box">
                        <form method="POST" action="/login">
						@csrf
                            <div class="field">
                                <div class="control">
                                    <input class="input is-large" type="email" name="email" placeholder="Your Email" autofocus="">
                                </div>
                            </div>

                            <div class="field">
                                <div class="control">
                                    <input class="input is-large" type="password" name="password" placeholder="Your Password">
                                </div>
                            </div>
							

							  </div>
                            <button class="button is-block is-primary is-large is-fullwidth">Login <i class="fas fa-sign-in-alt"></i></button>
                        </form>

						
						
                    </div>
                    <p class="has-text-grey">
                        <a href="/register">Sign Up</a> &nbsp;·&nbsp;
                        <a href="/forgot-password">Forgot Password</a> &nbsp;·&nbsp;
                    </p>
                </div>
            </div>
        </div>
    </section>
@include('include.footer')