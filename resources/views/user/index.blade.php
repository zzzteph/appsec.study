@include('include.header')
<section class="section pt-3">
<div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
         <ul>
            <li><a href="{{route('users')}}">Users</a></li>
            <li class="is-active"><a href="#" >{{$user->name}}</a></li>
         </ul>
      </nav>
	  <hr/>
</div>


   <div class="container">
      <div class="card is-shadowless	">
         <div class="card-content">
            <div class="media">
			
			
				@isset($user->avatar)
               <div class="media-left">
                  <figure class="image is-128x128">
                     <img src="{{$user->avatar}}">
                  </figure>
               </div>
				@endisset

			<div class="media-content">
                  <p class="title is-4">{{$user->name}}
                     @auth
                     @if(Auth::id()==$user->id)
                     <a class="button is-success is-small is-outlined is-text" href="{{route('edit-user-page',['id' => $user->id])}}"> 
                     <span class="icon-text is-size-5 is-align-items-center">
                     <span class="icon is-small">
                     <i class="fas fa-pen"></i>
                     </span>
                     </span>
                     </a>
                     @endif
                     @endauth
                  </p>
               </div>
            </div>
         </div>
      </div>
      <div class="columns">
         <div class="column is-one-fifth">
            <span class="icon-text is-size-5 is-align-items-center">
            <span class="icon is-large">
            <i class="fas fa-star fa-lg"></i>
            </span>
            <span>{{$user->rating}} of {{App\Models\User::count()}}</span>
            </span>
         </div>
         <div class="column is-one-fifth">
            <span class="icon-text is-size-5 is-align-items-center">
            <span class="icon is-large">
            <i class="fas fa-coins fa-lg"></i>
            </span>
            <span>{{$user->user_statistic->score}} points</span>
            </span>
         </div>
         <div class="column is-one-fifth">
            <span class="icon-text is-size-5 is-align-items-center">
            <span class="icon is-large">
            <i class="fas fa-calendar fa-lg"></i>
            </span>
            <span>{{$user->days}} days</span>
            </span>
         </div>
      </div>

   </div>
</section>
@include('include.footer')