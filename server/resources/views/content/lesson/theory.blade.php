@include('include.header')
    <section class="section">
	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li><a href="#">Courses</a></li>
			<li><a href="{{route('topics',['id' => $course->id])}}">{{$course->name}}</a></li>
			<li><a href="{{route('lessons',['course_id' => $course->id,'topic_id' => $topic->id])}}">{{$topic->name}}</a></li>
			
		  </ul>
	</nav>
    </div>

		 <div class="container">
<h1 class="title">{{$lesson->theory->header}}
 @if($node->status=='success')
  <span class="icon has-text-success">
    <i class="fas fa-check"></i>
  </span>
@elseif($node->status=='fail')

  <span class="icon has-text-danger">
    <i class="fas fa-ban"></i>
  </span>

@endif




</h1>
<div class="content">
{!! $lesson->theory->content !!}

</div>
		</div>

    </section>
	
		 <section class="section">
		 <div class="container">


 
 <hr/>
 @if($node->status!='success' && $node->status!='fail')
	 
  <div class="columns is-mobile">



@if($lesson->theory->cancel==TRUE)
 <div class="column is-half">
@else
	 <div class="column is-full">
@endif
  <form method="POST" action="{{route('mark-theory-as-read',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id' => $lesson->id])}}">
  @method('PUT')
  @csrf
<div class="field">
  <div class="control">
    <button class="button is-success is-large is-fullwidth">
	
	<span class="icon-text">
  <span class="icon">
    <i class="fas fa-thumbs-up"></i>
  </span>
  <span>Confirm</span>
</span>
	
	
	
	
	
	</button>
  </div>
</div>
</form>
</div>

@if($lesson->theory->cancel==TRUE)
 <div class="column is-half">
  <form method="POST" action="{{route('mark-theory-as-canceled',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id' => $lesson->id])}}">
  @method('PUT')
  @csrf
<div class="field is-grouped-right">
  <div class="control">
    <button class="button is-danger is-large is-fullwidth">
	
	<span class="icon-text">
  <span class="icon">
    <i class="fas fa-ban"></i>
  </span>
  <span>Cancel</span>
</span>
	
	
	
	
	
	</button>
  </div>
</div>
</form>
</div>
@endif
	@endif
	</div>
			</div>

    </section>

	
@include('include.footer')