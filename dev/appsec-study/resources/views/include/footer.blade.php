
<script>
document.addEventListener('DOMContentLoaded', () => {
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  if ($navbarBurgers.length > 0) {
    $navbarBurgers.forEach( el => {
      el.addEventListener('click', () => {
        const target = el.dataset.target;
        const $target = document.getElementById(target);
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    });
  }

});
</script>

@auth
	@if(!is_null(Auth::user()->current_user_lab_vm()) && Auth::user()->current_user_lab_vm()->status!='terminated' && Auth::user()->current_user_lab_vm()->status!='running')
		<script>

	new Vue({
		el: "#timer",
		data: {
			vm: null,
			interval: null,

		},
		methods: {

			getVM: function(event) {
				axios.get('/api/v1/task/{{Auth::user()->current_user_lab_vm()->id}}').then((response) => {
					this.vm = response.data;
					if (this.vm.status == 'terminated' || this.vm.status == 'running') {
						document.location.reload(true);
					}
				}).catch(error => {
					
					document.location.reload(true);
					
				});;

			},

		},
		mounted: function() {
			this.getVM();
			var self = this;
			this.interval = setInterval(function() {
				self.getVM();
			}, 5000);
		}

	});
	</script>

	@endif
	

	@if(!is_null(Auth::user()->current_user_lab_vm()) && Auth::user()->current_user_lab_vm()->status=='running')
		<script>

	new Vue({
		el: "#timer",
		data: {
			vm: null,
			interval: null,

		},
		methods: {

			getVM: function(event) {
				axios.get('/api/v1/task/{{Auth::user()->current_user_lab_vm()->id}}').then((response) => {
					this.vm = response.data;
					if (this.vm.status != 'running') {
						document.location.reload(true);
					}
				}).catch(error => {
					
					document.location.reload(true);
					
				});;

			},

		},
		mounted: function() {
			this.getVM();
			var self = this;
			this.interval = setInterval(function() {
				self.getVM();
			}, 5000);
		}

	});
	</script>

	@endif
	



	@if(!is_null(Auth::user()->user_vm()) && Auth::user()->user_vm()->status!='terminated' && Auth::user()->user_vm()->status!='running')
		<script>

	new Vue({
		el: "#uservm",
		data: {
			uservm: null,
			interval: null,

		},
		methods: {

			getVM: function(event) {
				axios.get('/api/v1/task/{{Auth::user()->user_vm()->id}}').then((response) => {
					this.uservm = response.data;
					if (this.uservm.status == 'terminated' || this.uservm.status == 'running') {
						document.location.reload(true);
					}
				}).catch(error => {
					
					document.location.reload(true);
					
				});;

			},

		},
		mounted: function() {
			this.getVM();
			var self = this;
			this.interval = setInterval(function() {
				self.getVM();
			}, 5000);
		}

	});
	</script>

	@endif

	@if(!is_null(Auth::user()->user_vm()) && Auth::user()->user_vm()->status=='running')
		<script>

	new Vue({
		el: "#uservm",
		data: {
			uservm: null,
			interval: null,

		},
		methods: {

			getVM: function(event) {
				axios.get('/api/v1/task/{{Auth::user()->user_vm()->id}}').then((response) => {
					this.uservm = response.data;
					if (this.uservm.status != 'running') {
						document.location.reload(true);
					}
				}).catch(error => {
					
					document.location.reload(true);
					
				});;

			},

		},
		mounted: function() {
			this.getVM();
			var self = this;
			this.interval = setInterval(function() {
				self.getVM();
			}, 5000);
		}

	});
	</script>

	@endif
	


	
	
@endauth
</div>
<footer class="footer is-fixed-bottom">
   <div class="content has-text-centered">

   <strong>AppsecStudy</strong> 2021-{{ now()->year }} <br/>

   <p>
   <strong>AppsecStudy</strong> - open-source elearning management system for information security.<br/>
   Follow us <a href="https://github.com/zzzteph/appsec.study">https://github.com/zzzteph/appsec.study</a><br/>
   
   </p>
      <p>
         <span class="icon-text is-align-items-center">
         <a href="https://twitter.com/w34kp455">
         <span class="icon">
         <i class="fab fa-twitter"></i>
         </span>
       
         </a>
         </span>

         <span class="icon-text is-align-items-center">
		 
          <span> <a href="https://github.com/zzzteph">  </span>
         <span class="icon">
			<i class="fab fa-github"></i>
         </span>

         </a>
         </span>
		 
      </p>
   </div>
</footer>


</body>
</html>