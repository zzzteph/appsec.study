@include('include.header')



    <section class="hero">
        <div class="hero-body">
		

				
            <div class="container has-text-centered">
				<div class="column is-4 is-offset-4">

                    <h3 class="title has-text-black">You need to verify your email</h3>
                    <hr class="login-hr">
                    <div class="box">
                        <form method="POST" action="/email/verification-notification">
						@csrf
                            <button class="button is-block is-success is-large is-fullwidth">Send a link <i class="fas fa-envelope"></i></button>
                        </form>
                    </div>
                    <p class="has-text-grey">
                        <a href="/login">Sign In</a> &nbsp;·&nbsp;
                        <a href="/restore">Forgot Password</a> &nbsp;·&nbsp;
                    </p>
                </div>
            </div>
        </div>
    </section>
@include('include.footer')