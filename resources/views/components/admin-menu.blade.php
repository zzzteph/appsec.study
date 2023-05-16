@auth
	@if(Auth::user()->role==='admin')
      <div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-link">
          Cloud
        </a>




        <div class="navbar-dropdown">
          <a class="navbar-item" href="{{route('cloud-view')}}">
            Cloud config
          </a>
		  <a class="navbar-item" href="{{route('admin-list-templates')}}">
            Templates
          </a>
		  
		  
          <a class="navbar-item" href="{{route('vms')}}">
            VMS
          </a>
          <a class="navbar-item" href="{{route('admin-users')}}">
            Users
          </a>
          <hr class="navbar-divider">
          <a class="navbar-item" href="{{route('monitor-task')}}">
            Jobs monitoring
          </a>
        </div>
      </div>
@endif
@endauth

