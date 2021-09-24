@include('include.header')
    <section class="section">
	
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li><a href="{{route('courses')}}">Courses</a></li>
			<li><a href="{{route('topics',['id' => $course->id])}}">{{$course->name}}</a></li>
			<li class="is-active"><a href="#" >{{$topic->name}}</a></li>
		  </ul>
	</nav>
	
	
	<h1 class="title"> {{$topic->name}} </h1>
	
<hr/>
    </div>

		 <div class="container">



 @if($nodes!=FALSE)
@foreach ($nodes as $node)
 @if($node->status=='success')
<article class="media box has-background-success-light">
@elseif($node->status=='fail')
<article class="media box has-background-danger-light">
@else
	<article class="media box">
@endif
  <figure class="media-left">
  
  <span class="icon-text is-align-items-center">
  <span class="icon is-large">
  @if($node->lesson->type=="theory")
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
			<a href="{{route('view-lesson',['course_id' => $course->id,'topic_id' => $topic->id,'node_id'=>$node->node_id])}}">{{$node->lesson->name}}</a>
		</strong>

        <br>
{!! $node->lesson->description !!}
      </p>

    </div>
	
	
	

  </div>
  <div class="media-right">

@if($node->status=='success')
<p>
<span class="icon-text is-size-5 is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-check fa-lg"></i>
  </span>
</span>
</p>
@endif
@if($node->status=='fail')
<p>
<span class="icon-text is-size-5 is-align-items-center">
  <span class="icon is-large">
    <i class="fas fa-ban fa-lg"></i>
  </span>
</span>
</p>	
@endif
  </div>
</article>
   
   
@endforeach
@endif




    </div>

    </section>
@include('include.footer')