@auth
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
		
          <a class="navbar-item" href="{{route('list-archived-tournaments')}}">
            Archived
          </a>
        </div>
</div>
@endauth