@include('include.header')
<section class="section">

   <div class="container">
   <h1 class="title">Courses</h1>
   
  @foreach ($topics as $topic)
	@if($loop->iteration%4==0 && !$loop->first)
	</div>
	<div class="columns is-multiline">
   @endif
   @if($loop->first)
   <div class="columns is-multiline">
   @endif
   
   <div class="column is-4-desktop">

		   <div class="box">

            <h2 class="mb-2 is-size-3 is-size-4-mobile has-text-weight-bold has-text-black">  <a class="has-text-primary is-underlined" href="{{route('lessons',['topic_id' => $topic->id])}}">{{$topic->name}}</a></h2>
			   @if($topic->is_done)
       <span class="tag is-primary">Done</span>
		@endif
		<div class="content">
		
		<p>{{$topic->description}}</p>
		
		</div>
			
            <table class="table is-fullwidth ">
               <tbody>
			    @if($topic->theory_lesson_done_count!=0)
			      <tr>
                     <td>Theory</td>
                     <td>
					
						{{$topic->theory_lesson_done_count}}
					
					 
					 </td>
                  </tr>
				   @endif
			    @if($topic->lab_lesson_done_count!=0)
			   	<tr>
                     <td>Labs</td>
                     <td>
					
						{{$topic->lab_lesson_done_count}}
					
					 
					 </td>
                  </tr>
				   @endif
				     @if($topic->user_score_in_leaderboard>0)
				<tr>
                     <td>Score</td>
                     <td>
					 {{$topic->user_score_in_leaderboard}}
					 </td>
                  </tr>  
				   @endif
				  
				  
               </tbody>
            </table>
		
			<x-topic-leaderboard :topic="$topic" :limit="5" />
         </div>
      </div>
      @if($loop->last)
   </div>
   @endif 
   @endforeach
   </div>
</section>
@include('include.footer')