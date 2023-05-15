
<script>
document.addEventListener('DOMContentLoaded', function() {
    const menus = document.querySelectorAll('.navbar-burger');
    const dropdowns = document.querySelectorAll('.navbar-menu');

    if (menus.length && dropdowns.length) {
        for (var i = 0; i < menus.length; i++) {
            menus[i].addEventListener('click', function() {
                for (var j = 0; j < dropdowns.length; j++) {
                    dropdowns[j].classList.toggle('is-active');
                }
            });
        }
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
	



	

	


	
	
@endauth
<footer class="section">
   <div class="container pb-5 has-text-centered">
	  
	   <p><strong>AppsecStudy</strong> 2022-{{ now()->year }} </p>
	  
	  
         <p>
            <span class="icon-text has-text-black is-black">
            <a href="https://twitter.com/w34kp455">
            <span class="icon is-black has-text-black">
            <i class="fab fa-twitter"></i>
            </span>
          
            </a>
            </span>

		<span class="icon-text has-text-black is-black">
            <a href="https://github.com/zzzteph/appsec.study">
            <span class="icon is-black has-text-black">
        <i class="fab fa-github"></i>
            </span>
            </a>
            </span>
			
			
			
			
         </p>
      </div>
   </footer>



</div>

</body>
</html>