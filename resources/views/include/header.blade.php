<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<script href="{{asset('js/jquery.js')}}" type="text/javascript"></script>
    <link rel="stylesheet" href="{{asset('css/bulma.min.css')}}">
	<link rel="stylesheet" href="{{asset('css/inter.css')}}">
	 <script defer src="{{asset('fontawesome/js/all.js')}}" type="text/javascript"></script>
	 <script src="{{asset('js/vue.js')}}" type="text/javascript"></script>
	 <script src="{{asset('js/axios.min.js')}}" type="text/javascript"></script>

	    <style type="text/css" media="screen">
      body {
        display: flex;
        min-height: 100vh;
        flex-direction: column;
      }
      #wrapper {
        flex: 1;
      }
    </style>
  </head>
<body>

    <div class="">
                
      
      
                
      <nav class="navbar py-4">
        <div class="container">
          <div class="navbar-brand">
            <a class="navbar-item" href="{{route('main')}}"><img src="{{asset('appsec.png')}}" alt="" width="100"></a>
            <a class="navbar-burger" role="button" aria-label="menu" aria-expanded="false">
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </a>
          </div>
          <div class="navbar-menu">
            <div class="navbar-start">
      <a class="navbar-item" href="{{route('topics')}}">
        Learn
      </a>
	  

      <a class="navbar-item" href="{{route('users')}}">
        Scoreboard
      </a>
	  
@auth
     <x-tournament-menu/>
@endauth


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








      </div>
	  
	  
	         <div class="navbar-end">
    





	  @auth


	       <a class="navbar-item" href="#">
		   
		   
		   
		   	 <span class="icon-text is-align-items-center">
 
                  <span> {{Auth::user()->user_statistic->score/100}}</span>
				  
				   <span class="icon">
					<i class="fas fa-money-bill"></i>
                  </span>
				  
                  </span>
          </a>


          <a class=" navbar-item is-primary-light" href="{{ route('user-page',['id' => Auth::id()]) }}">
            My page
          </a>


  
	  	         


	@if(!is_null(Auth::user()->current_user_lab_vm()) && Auth::user()->current_user_lab_vm()->status!="terminated")
<div class="navbar-item">
	<div id="timer">
		  <a class="button is-primary" href="{{route('view-lesson',[
		  'topic_id'=>Auth::user()->current_user_lab_vm()->node()->topic->id,
		  'node_id'=>Auth::user()->current_user_lab_vm()->node()->id
		  ])}}"  v-if="vm.status == 'running'">

<span class="icon-text">

<span>Current task</span>
  <span class="icon">
    <i v-if="vm.timeout > 45" class="fas fa-hourglass-start"></i>
	<i v-else-if="vm.timeout<=45 && vm.timeout>15" class="fas fa-hourglass-half"></i>
	<i v-else-if="vm.timeout<=15 && vm.timeout>5" class="fas fa-hourglass-end"></i>
	<i v-else class="fas fa-hourglass"></i>
  </span>
<span>@{{ vm.timeout }}</span>



</span>
</a>


<a class="navbar-item mr-3 " v-if="vm.status != 'running' && vm.status != 'terminated'" href="{{route('view-lesson',[
		  'topic_id'=>Auth::user()->current_user_lab_vm()->node()->topic->id,
		  'node_id'=>Auth::user()->current_user_lab_vm()->node()->id
		  ])}}">
<span class="icon-text" >

<span v-if="vm.status == 'todo' || vm.status == 'starting'">Starting task</span>
<span v-if="vm.status == 'tostop' || vm.status == 'stopping'">Stopping task</span>

   <progress class="progress is-small is-warning mt-1	" v-if="vm.status=='todo'"  :value="vm.progress" max="100">@{{vm.progress}}%</progress>
            <progress class="progress is-small is-success mt-1	" v-if="vm.status=='starting'" :value="vm.progress" max="100">@{{vm.progress}}%</progress>
            <progress class="progress is-small is-warning mt-1	" v-if="vm.status=='tostop'" :value="vm.progress" max="100">@{{vm.progress}}%</progress>
            <progress class="progress is-small is-danger mt-1	" v-if="vm.status=='stopping'" :value="vm.progress" max="100">@{{vm.progress}}%</progress>
</span>
</a>

			</div>

</div>


	@endif

<div class="navbar-item">
<div class="buttons">
			<form method="POST"  action="{{route('logout')}}">
		@method('DELETE')
			@csrf
            <button class="button is-black">Log out</button>
			</form>
        </div>


	   @endauth

      </div>





    </div>
	  
            
          </div>
        </div>
      </nav>
@if ($errors->any() || Session::has('success'))
	<section class="section">
 <div class="container">
	 <div class="container is-size-5">
@if ($errors->any())
							<article class="message is-danger">
  <div class="message-header">
    <p>Error</p>
  </div>
  <div class="message-body has-text-left">
   <ul>
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
  </div>
</article>
@endif
@if (Session::has('success'))

							<article class="message is-success">
  <div class="message-header">

  </div>
  <div class="message-body has-text-left">
   <ul>
<li>{{ Session::get('success') }}</li>
        </ul>
  </div>
</article>



@endif


 </div>



</div>
</section>
@endif

