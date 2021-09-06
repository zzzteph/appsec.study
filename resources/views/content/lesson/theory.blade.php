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
	</section>
	 <section class="section">
		 <div class="container">
<h1 class="title">{{$lesson->theory->header}}
 @if($lesson->status=='done')
  <span class="icon has-text-success">
    <i class="fas fa-check"></i>
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
 @if($lesson->status!='done')
	 
 
  <form method="POST" action="{{route('mark-theory-as-read',['course_id' => $course->id,'topic_id' => $topic->id,'lesson_id' => $lesson->id])}}">
  @method('PUT')
  @csrf
<div class="field">
  <div class="control">
    <button class="button is-success">
	
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

	@endif
			</div>

    </section>

	
@include('include.footer')