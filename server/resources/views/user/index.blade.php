@include('include.header')



	 <section class="section">
		 <div class="container">



<div class="card is-shadowless	">
  <div class="card-content">
    <div class="media">
      <div class="media-left">
        <figure class="image is-128x128">
         <img src="{{$user->avatar}}">
        </figure>
      </div>
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

<div class="content">
<h2 class="subtitle">Last lessons</h2>

<hr/>
@foreach ($user->nodes as $node)
    @if ($node->status == 'todo')
        @continue
    @endif

 @if($node->status=='success')
<article class="media box has-background-success-light">
@elseif($node->status=='fail')
<article class="media box has-background-danger-light">
@endif

  <figure class="media-left">
  
  <span class="icon-text is-align-items-center">
  <span class="icon is-large">
        @if($node->topic_node->lesson->type=="theory")
    <i class="fas fa-book-open fa-lg"></i>
	@else
	 <i class="fas fa-flask fa-lg"></i>
	@endif
		
	
	
  </span>
</span>
  
  
  </figure>
  <div class="media-content ">
    <div class="content">
      <p>
        <strong class="is-size-4">
		{{$node->topic_node->lesson->name}}
		</strong>
      </p>
	<p>
	{{$node->topic_node->created_at}}
	</p>	
	  
    </div>
	
	
	

  </div>

</article>
   



@endforeach



</div>



    </div>

    </section>



@include('include.footer')