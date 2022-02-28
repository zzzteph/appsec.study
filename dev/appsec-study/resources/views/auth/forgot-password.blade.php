@include('include.header')
    <section class="hero">
        <div class="hero-body">
            <div class="container has-text-centered">
                <div class="column is-4 is-offset-4">

		
				
				
                    <h3 class="title has-text-black">Password restore</h3>
                    <hr class="login-hr">
                    <div class="box">
                        <form method="POST" action="/forgot-password">
						@csrf
                            <div class="field">
                                <div class="control">
                                    <input class="input is-large" type="email" name="email" placeholder="Your Email" autofocus="">
                                </div>
                            </div>
							  </div>
                            <button class="button is-block is-primary is-large is-fullwidth">Send instructions <i class="fas fa-sign-in-alt"></i></button>
                        </form>

						
						
                    </div>
                    <p class="has-text-grey">
                        <a href="/login">Sign In</a> &nbsp;·&nbsp;
                         <a href="/register">Sign Up</a> &nbsp;·&nbsp;
                    </p>
                </div>
            </div>
        </div>
    </section>
@include('include.footer')