@include('include.header')
<section class="section">
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
    <div class="mb-6 pb-5 columns is-multiline is-centered">

    </div>
    <div class="is-vcentered columns is-multiline is-centered">

      <div class="column is-8 is-6-desktop is-relative">
        <div class="mx-auto mb-5 box p-6 has-background-light has-text-centered">
          <div style="position: absolute; top: 0; left: 50%; transform: translate(-50%, -40%)">
		  @isset($user->avatar)
            <img class="mx-auto image is-fullwidth" src="{{$user->avatar}}" alt="">
			@endisset
          </div>
		  <br/>
		  <br/>
          <h4 class="mt-3 mb-2 is-size-5 has-text-weight-bold">{{$user->name}}</h4>
		    @auth
                @if(Auth::id()==$user->id)
					<p class="mb-5 has-text-grey"><a class="has-text-success" href="{{route('edit-user-page',['id' => $user->id])}}">Edit</a></p>
               @endif
            @endauth




      <div class="columns">
         <div class="column">
            <span class="icon-text is-size-5 is-align-items-center">
            <span class="icon is-large">
            <i class="fas fa-star fa-lg"></i>
            </span>
            <span>{{$user->rating}} of {{App\Models\User::count()}}</span>
            </span>
         </div>
         <div class="column">
            <span class="icon-text is-size-5 is-align-items-center">
            <span class="icon is-large">
            <i class="fas fa-coins fa-lg"></i>
            </span>
            <span>{{$user->user_statistic->score}} points</span>
            </span>
         </div>
         <div class="column ">
            <span class="icon-text is-size-5 is-align-items-center">
            <span class="icon is-large">
            <i class="fas fa-calendar fa-lg"></i>
            </span>
            <span>{{$user->days}} days</span>
            </span>
         </div>
      </div>

        </div>
      </div>

    </div>


  </div>
</section>
@include('include.footer')