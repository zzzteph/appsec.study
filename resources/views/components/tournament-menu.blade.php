<div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-link">
          Tournaments
        </a>
        <div class="navbar-dropdown">
			
			@foreach($tournaments as $tournament)
			@if($tournament->is_tournament_started==TRUE)
				
				  <a class="navbar-item" href="{{route('view-tournament',['id'=>$tournament->id])}}">
					  {{$tournament->name}}
				  </a>
		  @endif
		  @endforeach
			

			@foreach($tournaments as $tournament)
			@if($tournament->is_tournament_planned==TRUE)
          <a class="navbar-item" href="{{route('view-tournament',['id'=>$tournament->id])}}">
			  {{$tournament->name}}
          </a>
		  @endif
		  @endforeach
		 <hr class="navbar-divider">
          <a class="navbar-item" href="{{route('admin-users')}}">
            Archived
          </a>
        </div>
</div>