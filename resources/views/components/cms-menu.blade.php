@auth
@if(Auth::user()->role==='admin')
	      <div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-link">
          CMS
        </a>
        <div class="navbar-dropdown">
	       <a class="navbar-item" href="{{route('admin-view-lessons')}}">
            Lessons
          </a>
		 <a class="navbar-item" href="{{route('admin-list-topics')}}">
           Topics
          </a>
		 <a class="navbar-item" href="{{route('admin-list-tournaments')}}">
           Tournaments
          </a>
		  		 <a class="navbar-item" href="{{route('admin-list-assessments')}}">
           Assessments
          </a>
		  
		  
		  
        </div>
      </div>
	@endif
@endauth
