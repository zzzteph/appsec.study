@include('include.header')
<section class="section pt-3">
   <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
         <ul>
            <li><a href="{{route('lessons',['topic_id' => $topic->id])}}">{{$topic->name}}</a></li>
            <li class="is-active"><a href="#" >{{$lesson->theory->header}}</a></li>
         </ul>
      </nav>
	     @if($node->status=='success')
      <h1 class="title has-text-success">
      
         @elseif($node->status=='fail')
		<h1 class="title has-text-danger">
		@else
	   <h1 class="title">
         @endif
		 {{$lesson->theory->header}}
      </h1>
      <hr/>
   </div>
   <div class="container">
      <div class="content">
         {!! $lesson->theory->content !!}
      </div>
   </div>
</section>
@if($node->status!='success' && $node->status!='fail')	
<section class="section">
   <div class="container">
   <hr/>
   <div class="columns is-mobile">
      @if($lesson->theory->cancel==TRUE)
      <div class="column is-half">
         @else
         <div class="column is-full">
            @endif
            <form method="POST" action="{{route('mark-theory-as-read',['topic_id' => $topic->id,'lesson_id' => $lesson->id])}}">
               @method('PUT')
               @csrf
               <div class="field">
                  <div class="control">
                     <button class="button is-success is-large is-fullwidth">
                     <span class="icon-text is-align-items-center">
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
            <form method="POST" action="{{route('mark-theory-as-canceled',['topic_id' => $topic->id,'lesson_id' => $lesson->id])}}">
               @method('PUT')
               @csrf
               <div class="field is-grouped-right">
                  <div class="control">
                     <button class="button is-danger is-large is-fullwidth ">
                     <span class="icon-text is-align-items-center">
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
      </div>
   </div>
</section>
@endif
@include('include.footer')