@include('include.header')
<section class="section pt-3">
   <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
      </nav>
      <hr/>
   </div>
   <div class="container">
      @foreach ($courses as $course)
	  <a href="{{route('topics',['id' => $course->id])}}">
      <article class="media box">
         <figure class="media-left is-hidden-mobile">
            <p class="image is-128x128">
               <img src="{{$course->image}}">
            </p>
         </figure>
         <div class="media-content">
            <div class="content">
               <p>
                  <strong class="is-size-4">{{$course->name}} </strong>
                  <br>
                  {{$course->description}}
               </p>
            </div>
         </div>
         <div class="media-right is-hidden-mobile">
		 @if($course->theory_lesson_done_count>0)
            <p>
               <span class="icon-text  is-size-5  is-align-items-center">
               <span class="icon is-large">
               <i class="fas fa-tasks fa-lg"></i>
               </span>
               <span>{{$course->theory_lesson_done_count}}</span>
               </span>
            </p>
			@endif
			@if($course->lab_lesson_done_count>0)
            <p>
               <span class="icon-text  is-size-5 is-align-items-center">
               <span class="icon is-large">
               <i class="fas fa-flask fa-lg"></i>
               </span>
               <span>{{$course->lab_lesson_done_count}}</span>
               </span>
            </p>
			@endif
            <p>
               <span class="icon-text is-size-5 is-align-items-center">
               <span class="icon is-large">
               <i class="fas fa-graduation-cap fa-lg"></i>
               </span>
               <span>{{$course->topics_done_count}}/{{$course->topics_count}}</span>
               </span>
            </p>
         </div>
      </article>
	  </a>
	  <br/>
      @endforeach
   </div>
</section>
@include('include.footer')